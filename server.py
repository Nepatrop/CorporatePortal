from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

port = 8000
server_address = ('', port)
httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
print(f'\nhttp://localhost:{port}')
httpd.serve_forever()