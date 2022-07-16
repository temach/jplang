use std::env;
use std::path;
use std::os::unix::net::UnixListener;
use std::fs;

use actix_web::{web, App, HttpServer, HttpResponse, HttpRequest, middleware::Logger, HttpMessage};
use awc::{ClientBuilder, Connector, http::Uri};
use awc_uds::UdsConnector;
use url::Url;

use html5ever::{QualName, Namespace, LocalName, ns, namespace_url};
use kuchiki::parse_html;
use kuchiki::NodeRef;
use kuchiki::ExpandedName;
use kuchiki::Attribute;

use log::{debug, info, error};
use clap::Parser;

// Some traits must be included to be used silently
use html5ever::tendril::TendrilSink;
use std::os::unix::fs::PermissionsExt;
use std::str::FromStr;

const BODY_LIMIT: usize =  5 * 1024 * 1024;
const HTML_NS: Namespace = namespace_url!("http://www.w3.org/1999/xhtml");

// state struct for actix-web
struct AppState {
    domain: String,
    debug: bool,
}

fn create_node(tagname: &str, attrs: Vec<(&str, String)>) -> NodeRef {
    let mut attributes = Vec::new();
    for (name, value) in attrs {
        attributes.push((
            ExpandedName::new(ns!(), LocalName::from(name)),
            Attribute { prefix: None, value: value }
        ));
    };
    let qualname = QualName::new(None, HTML_NS, LocalName::from(tagname));
    NodeRef::new_element(qualname, attributes)
}


async fn router(
    req: HttpRequest,
    node: String, 
    service: String, 
    path: String, 
    appstate: web::Data<AppState>, 
    body: web::Bytes,
) -> HttpResponse {
    debug!("Request: {:?}", req);

    let scheme = "http";

    // set netloc (also used to set Host header)
    let netloc = if service.contains(":") && appstate.debug {
        let (service_name, service_port) = match service.split_once(':') {
            Some(tuple) => tuple,
            None => {
                error!("Bad service name {:?}. Could not split into name:port tuple.", service);
                return HttpResponse::build(actix_web::http::StatusCode::BAD_REQUEST).finish();
            },
        }; 
        format!("{}.{}:{}", service_name, &appstate.domain, service_port)
    } else {
        format!("{}.{}", service, &appstate.domain)
    };
    debug!("Netloc: {:?}", netloc);

    // Make target url
    let url = {
        let base_str = format!("{}://{}", scheme, &netloc);
        let mut url = match Url::parse(&base_str) {
            Ok(u) => u,
            Err(error) => {
                error!("Error with request {:?}", error);
                return HttpResponse::build(actix_web::http::StatusCode::BAD_REQUEST).finish();
            },
        };
        url.set_path(&path);
        let s = req.query_string();
        if !s.is_empty() {
            url.set_query(Some(s));
        }
        url
    };

    let infoline = format!("{} {}", req.method(), url.as_str());
    debug!("Requesting line {}", infoline);

    let (client_req, is_unixsock) = {
        let p = format!("/opt/moonspeak/unixsock/{}.sock", service);
        let unixsock = path::Path::new(&p);

        let builder = ClientBuilder::new().disable_redirects();

        // select normal or uds client builder
        let (client, is_unixsock) = if unixsock.exists() {
            // uds sockets via https://docs.rs/awc-uds/0.1.1/awc_uds/
            let uds_connector = Connector::new().connector(UdsConnector::new(unixsock));
            debug!("{} via unixsock {:?}", infoline, unixsock);
            (builder.connector(uds_connector).finish(), true)
        } else {
            (builder.finish(), false)
        };

        // make request from incoming request, copies method and headers
        let uri = Uri::from_str(url.as_str()).expect("This should never happen: could not parse a valid url");
        let client_req = client
            .request_from(uri, req.head())
            .insert_header((actix_web::http::header::HOST, netloc.as_str()));

        debug!("Requesting {:?}", client_req);

        (client_req, is_unixsock)
    };


    let finalised = match body.len() {
        0 => client_req.send(),
        _ => client_req.send_body(body),
    };

    let mut client_resp = match finalised.await {
        Ok(r) => r,
        Err(error) => {
            error!("Error requesting {:?} : {:?}", infoline, error);
            return HttpResponse::build(actix_web::http::StatusCode::BAD_GATEWAY).finish();
        },
    };

    debug!("client resp {:?}", client_resp);

    let client_resp_raw_body = match client_resp.body().limit(BODY_LIMIT).await {
        Err(error) => {
            error!("Could not read body from request {} : {:?}", infoline, error);
            return HttpResponse::build(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR).finish();
        },
        Ok(raw_bytes) =>
            if client_resp.content_type().contains("text/html") {
                // if client had "text/html" then we need to transform the response
                let utf8_body = std::str::from_utf8(&raw_bytes).unwrap();

                // Use kuchiki to create an html5ever parser
                let parser = parse_html();

                // run html5ever parser, to get back a kuchiki dom node
                let dom :NodeRef = parser.one(utf8_body);

                // create <base>, use the actual path as root_url, otherwise relative paths "../common/" break
                let base_node = create_node("base", vec![("href", req.path().to_string())]);

                debug!("base tag {:?}", base_node);

                // find first head element and append base tag
                let head = match dom.select_first("head") {
                    Ok(h) => h,
                    Err(error) => {
                        error!("No <head> found in text/html body response for {}, error {:?}", infoline, error);
                        return HttpResponse::build(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR).finish();
                    },
                };

                let head_node = head.as_node();
                head_node.prepend(base_node);

                // serialize the new body, add a few bytes to capacity to accomodate modified HTML
                let mut utf8_body_modified = Vec::with_capacity(raw_bytes.len() + 200);
                match dom.serialize(&mut utf8_body_modified) {
                    Ok(_) => utf8_body_modified,
                    Err(error) => {
                        error!("Error serialising HTML for {} after modification: {:?}", infoline, error);
                        return HttpResponse::build(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR).finish();
                    }
                }
            } else {
                raw_bytes.to_vec()
            }
    };

    // begin our response
    let mut server_resp = HttpResponse::build(client_resp.status());
    for header in client_resp.headers().iter() {
        server_resp.insert_header(header);
    };

    // finalise response and return
    let finalised = if client_resp_raw_body.is_empty() {
        server_resp.finish()
    } else {
        server_resp.body(client_resp_raw_body)
    };

    debug!("responding {:?}", finalised);
    info!(
        r#"{} "{} {}" -> "{}" {}"#, 
        match is_unixsock {
            true => "unix ",
            false => "",
        },
        // req.method(), req.uri().path_and_query().unwrap_or(&actix_web::http::uri::PathAndQuery::from_static("/")),
        req.method(), req.uri(),
        infoline,
        finalised.status()
    );
    finalised
}


async fn handler2(
    req: HttpRequest,
    combined_path: web::Path<(String, String)>,
    body: web::Bytes,
    appstate: web::Data<AppState>, 
) -> HttpResponse {
    let (node, service) = combined_path.into_inner();
    router(req, node, service, String::new(), appstate, body).await
}

async fn handler3(
    req: HttpRequest,
    combined_path: web::Path<(String, String, String)>, 
    body: web::Bytes,
    appstate: web::Data<AppState>
) -> HttpResponse {
    let (node, service, path) = combined_path.into_inner();
    router(req, node, service, path, appstate, body).await
}

// Supports the following:
// curl 'http://moonspeak.test:8080/plus'
// curl 'http://moonspeak.test:8080/plus/'
// curl 'http://moonspeak.test:8080/plus' 
// curl 'http://moonspeak.test:8080/plus?q=1'
// curl 'http://moonspeak.test:8080/plus/x/y/z' 
// curl 'http://moonspeak.test:8080/plus/x/y/z?q=1'
// curl 'http://moonspeak.test:8080/plus/x/y/z/?q=1'
//
async fn handler_dev(
    req: HttpRequest,
    body: web::Bytes,
    appstate: web::Data<AppState>
) -> HttpResponse {
    // remove leading whitespace and slashes
    // so they dont affect .split_once() later
    let trimmed_path = req.uri().path()
        .trim().trim_start_matches("/");


    let (service_name, service_path) = if trimmed_path.contains("/") {
        // there was a full path e.g. moonspeak.test/plus/x/y/z?q=1
        // get the first segment and all segments except the first
        match trimmed_path.split_once('/') {
            Some(tuple) => tuple,
            None => {
                error!("Dev mode: bad path {:?}. Could not split into name:path tuple.", trimmed_path);
                return HttpResponse::build(actix_web::http::StatusCode::BAD_REQUEST).finish();
            }
        }
    } else if trimmed_path.contains("?") {
        // there was no trailing slash but a query e.g. moonspeak.test/plus?q=1
        // get the first segment and all of query
        match trimmed_path.split_once('?') {
            Some(tuple) => tuple,
            None => {
                error!("Dev mode: bad path {:?}. Could not split into name:path tuple.", trimmed_path);
                return HttpResponse::build(actix_web::http::StatusCode::BAD_REQUEST).finish();
            }
        }
    } else {
        // there was no trailing slash, e.g. moonspeak.test/plus
        (trimmed_path, "")
    };

    let s_service_name = String::from(service_name);
    let s_service_path = String::from(service_path);
    router(req, String::from("localhost"), s_service_name, s_service_path, appstate, body).await
}

/// Router component of moonspeak.
/// A reverse proxy that sets correct <base> tag in proxied HTML responses
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct RouterArgs {
    /// Path to unix domain socket for binding
    #[clap(long, value_parser, default_value_t = String::from("/opt/moonspeak/unixsock/router.sock"))]
    uds: String,

    /// TCP hostname interface on which to bind
    #[clap(long, value_parser, default_value_t = String::from("0.0.0.0"))]
    host: String,

    /// TCP port number on which to bind
    #[clap(long, value_parser, default_value_t = 80)]
    port: u16,
}


#[actix_web::main] // or #[tokio::main]
async fn main() -> std::io::Result<()> {

    // configure the "log" crate to use this level for "default" env, i.e. everywhere
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("debug"));

    let args = RouterArgs::parse();

    info!("CLI arguments: {:?}", args);
    info!("Appstate domain: {:?}", env::var("MOONSPEAK_DOMAIN").unwrap_or("moonspeak.test".to_string()));
    info!("Appstate debug: {:?}", env::var("MOONSPEAK_DEBUG").unwrap_or(String::new()).len() > 0);

    let listener = UnixListener::bind(args.uds.clone())?;

    // allow anyone to write to socket, by default allows only self
    fs::set_permissions(args.uds.clone(), fs::Permissions::from_mode(0o666))?;

    HttpServer::new(|| {
        let moonspeak_debug = env::var("MOONSPEAK_DEBUG").unwrap_or(String::new()).len() > 0;

        let app_base = App::new()
            .app_data(web::Data::new(AppState {
                domain: env::var("MOONSPEAK_DOMAIN").unwrap_or("moonspeak.test".to_string()),
                debug: moonspeak_debug,
            }))
            .wrap(Logger::default())
            .route("/router/{node}/{service}", web::to(handler2))
            .route("/router/{node}/{service}/{path:.*}", web::to(handler3));

        if moonspeak_debug {
            app_base.default_service(web::to(handler_dev))
        } else {
            app_base
        }
    })
    .bind((args.host, args.port))?
    .listen_uds(listener)?
    .run()
    .await
}
