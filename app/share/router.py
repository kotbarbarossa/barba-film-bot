import json

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=['share'])

_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.barbarossa.flickbook'

_HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Flickbook</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #faf7f2;
      color: #1a1814;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }}
    .card {{
      max-width: 360px;
      width: 100%;
      text-align: center;
    }}
    .logo {{ font-size: 48px; margin-bottom: 16px; }}
    .brand {{ font-size: 22px; font-weight: bold; margin-bottom: 20px; letter-spacing: 0.5px; }}
    .msg {{ font-size: 15px; color: #666; line-height: 1.6; margin-bottom: 24px; }}
    .btn {{
      display: inline-block;
      background: #f5d84b;
      color: #1a1814;
      padding: 14px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
    }}
    .hidden {{ display: none; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">&#127916;</div>
    <div class="brand">Flickbook</div>

    <div id="st-opening">
      <p class="msg">Открываем в приложении&#8230;</p>
    </div>
    <div id="st-store" class="hidden">
      <p class="msg">Установите Flickbook, чтобы открыть этот фильм.</p>
      <a href="{play_store}" class="btn">Скачать в Google Play</a>
    </div>
    <div id="st-ios" class="hidden">
      <p class="msg">Приложение для iOS пока недоступно.<br>
        Flickbook доступен в Google Play для Android.</p>
    </div>
  </div>
  <script>
    var deepLink = {deep_link_json};
    var playStore = {play_store_json};
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    var isAndroid = /Android/i.test(navigator.userAgent);

    function show(id) {{
      document.getElementById('st-opening').classList.add('hidden');
      document.getElementById(id).classList.remove('hidden');
    }}

    if (isIOS) {{
      show('st-ios');
    }} else if (isAndroid) {{
      window.location.href = deepLink;
      setTimeout(function () {{ show('st-store'); }}, 1500);
    }} else {{
      show('st-store');
    }}
  </script>
</body>
</html>
"""


def _render(movie_id: str) -> str:
    deep_link = f'flickbook://share/movie/{movie_id}'
    return _HTML_TEMPLATE.format(
        play_store=_PLAY_STORE,
        deep_link_json=json.dumps(deep_link),
        play_store_json=json.dumps(_PLAY_STORE),
    )


@router.get('/share/movie/{movie_id}')
async def share_movie(movie_id: str) -> HTMLResponse:
    return HTMLResponse(content=_render(movie_id))
