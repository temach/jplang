#[macro_use]
extern crate log;
use actix_web::{get, web, App, HttpServer, HttpResponse, HttpRequest, middleware::Logger};


fn router(req: HttpRequest, node: String, service: String, path: String) -> String {
    info!("Request: {:?}", req);

    format!("Welcome {}! {} to the url: {}", node, service, path)
}


async fn handler2(req: HttpRequest, combined_path: web::Path<(String, String)>) -> String {
    let (node, service) = combined_path.into_inner();
    router(req, node, service, String::new())
}

async fn handler3(req: HttpRequest, combined_path: web::Path<(String, String, String)>) -> String {
    let (node, service, path) = combined_path.into_inner();
    router(req, node, service, path)
}


#[actix_web::main] // or #[tokio::main]
async fn main() -> std::io::Result<()> {

    // configure the "log" crate to use "info" level for "default" env, i.e. everywhere
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("debug"));

    HttpServer::new(|| {
        App::new()
            .wrap(Logger::default())
            .route("/router/{node}/{service}", web::to(handler2))
            .route("/router/{node}/{service}/{other_url:.*}", web::to(handler3))
    })
    .bind(("0.0.0.0", 8080))?
    .bind_uds("./here.sock")?
    .workers(1)
    .run()
    .await
}
