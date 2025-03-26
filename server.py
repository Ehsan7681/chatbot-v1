import http.server
import socketserver
import os

PORT = 8000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

print(f"سرور در حال اجرا در پورت {PORT}...")
print(f"برای دسترسی به چت بات، در مرورگر خود آدرس http://localhost:{PORT} را باز کنید.")

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nسرور متوقف شد.") 