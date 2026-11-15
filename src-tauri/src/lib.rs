use std::time::Duration;

/// 原生 HTTP 请求：绕开 WebView 的 CORS 与防盗链限制。
///
/// 前端通过 `window.__TAURI_INTERNALS__.invoke('fetch_text', { url, referer })` 调用，
/// 与浏览器模式的本地代理保持同一份数据结构。
#[tauri::command]
async fn fetch_text(url: String, referer: Option<String>) -> Result<String, String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("only http(s) is supported".into());
    }

    let client = reqwest::Client::builder()
        .user_agent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
             (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        )
        .timeout(Duration::from_secs(25))
        .redirect(reqwest::redirect::Policy::limited(8))
        .build()
        .map_err(|err| err.to_string())?;

    let mut request = client.get(&url).header(
        reqwest::header::ACCEPT,
        "application/json, text/plain, */*",
    );

    if let Some(referer) = referer.filter(|value| !value.is_empty()) {
        request = request.header(reqwest::header::REFERER, referer);
    } else if let Ok(parsed) = reqwest::Url::parse(&url) {
        if let Some(host) = parsed.host_str() {
            request = request.header(
                reqwest::header::REFERER,
                format!("{}://{}/", parsed.scheme(), host),
            );
        }
    }

    let response = request.send().await.map_err(|err| err.to_string())?;
    let status = response.status();
    if !status.is_success() {
        return Err(format!("HTTP {}", status.as_u16()));
    }

    response.text().await.map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![fetch_text])
        .run(tauri::generate_context!())
        .expect("error while running Aurora TV");
}
