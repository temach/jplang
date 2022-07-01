#[macro_use]
extern crate log;
use std::env;
use url::{Url, ParseError};
use curl::easy::Easy;
use curl::easy::List;
use actix_web::{get, web, App, HttpServer, HttpResponse, HttpRequest, middleware::Logger};


// This struct represents state
struct AppState {
    domain: String,
}

fn router(
    req: HttpRequest,
    node: String, 
    service: String, 
    path: String, 
    appstate: web::Data<AppState>, 
    body: web::Bytes,
) -> Result<String, Box<dyn std::error::Error>> {
    info!("Request: {:?}", req);

    // figure out scheme and netloc: unix sock or TCP
    let scheme = "http";
    let netloc = format!("{}.{}", service, &appstate.domain);


    // Make target url
    let base_str = format!("{}://{}", scheme, netloc.as_str());
    let base = Url::parse(base_str.as_str())?;
    let url = base.join(path.as_str())?.join(req.query_string())?;
    info!("Requesting {} {:?}", req.method(), url.as_str());

    // Make target headers
    let mut headers = List::new();
    // a Set-Cookie can appear 3 times, then iterator will give three pairs of (header, value)
    for (header, value) in req.headers().iter() {
        let s = format!("{}: {}", header, value.to_str()?);
        headers.append(s.as_str()).unwrap();
    }
    info!("Requesting headers {:?}", headers);

    let mut handle = Easy::new();
    handle.custom_request(req.method().as_str());
    handle.url(url.as_str()).unwrap();
    handle.http_headers(headers).unwrap();

    // let mut transfer = handle.transfer();
    // transfer.read_function(|into| {
    //     let byteslice: &[u8] = &body[..];
    //     Ok(byteslice.read(into).unwrap())
    // }).unwrap();
    // Ok(transfer)

    let res = format!("Welcome {}! {} to the url: {}", node, service, path);
    Ok(res)
}


async fn handler2(
    req: HttpRequest,
    combined_path: web::Path<(String, String)>,
    body: web::Bytes,
    appstate: web::Data<AppState>, 
) -> String {
    let (node, service) = combined_path.into_inner();
    router(req, node, service, String::new(), appstate, body).unwrap()
}

async fn handler3(
    req: HttpRequest,
    combined_path: web::Path<(String, String, String)>, 
    body: web::Bytes,
    appstate: web::Data<AppState>
) -> String {
    let (node, service, path) = combined_path.into_inner();
    router(req, node, service, path, appstate, body).unwrap()
}


#[actix_web::main] // or #[tokio::main]
async fn main() -> std::io::Result<()> {

    // configure the "log" crate to use "info" level for "default" env, i.e. everywhere
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("debug"));

    HttpServer::new(|| {
        App::new()
            .app_data(web::Data::new(AppState {
                domain: env::var("MOONSPEAK_DOMAIN").unwrap_or("moonspeak.test".to_string()),
            }))
            .wrap(Logger::default())
            .route("/router/{node}/{service}", web::to(handler2))
            .route("/router/{node}/{service}/{path:.*}", web::to(handler3))
    })
    .bind(("0.0.0.0", 8080))?
    .bind_uds("./here.sock")?
    .workers(1)
    .run()
    .await
}
