var fs = require("fs");
var https = require("https");
var path = require("path");


var serverDir = path.dirname(__filename)
var clientDir = path.join(serverDir, "./");

var contentTypeMap = {
    ".html": "text/html;charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css"
};

var port = 3000

const options = {
    key: fs.readFileSync('./keys/server.key'),
    cert: fs.readFileSync('./keys/server.crt')
};

var server = https.createServer(options, function (request, response) {
    var headers = {
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache",
        "Expires": "0"
    };

    var parts = request.url.split("/");

    var url = request.url.split("?", 1)[0];
    var filePath = path.join(clientDir, url);
    if (filePath.indexOf(clientDir) != 0 || filePath == clientDir)
        filePath = path.join(clientDir, "./webrtc.html");

    fs.stat(filePath, function (err, stats) {
        if (err || !stats.isFile()) {
            response.writeHead(404);
            response.end("404 Not found");
            return;
        }

        var contentType = contentTypeMap[path.extname(filePath)] || "text/plain";
        response.writeHead(200, { "Content-Type": contentType });

        var readStream = fs.createReadStream(filePath);
        readStream.on("error", function () {
            response.writeHead(500);
            response.end("500 Server error");
        });
        readStream.pipe(response);
    });
});

console.log('The server is listening on port ' + port);
server.listen(port);

var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({server: server});
 
// 存储socket的数组，这里只能有2个socket，每次测试需要重启，否则会出错
var wsc = [],
index = 1;
 
// 有socket连入
wss.on('connection', function(ws) {
    console.log('connection');
 
    // 将socket存入数组
    wsc.push(ws);
 
    // 记下对方socket在数组中的下标，因为这个测试程序只允许2个socket
    // 所以第一个连入的socket存入0，第二个连入的就是存入1
    // otherIndex就反着来，第一个socket的otherIndex下标为1，第二个socket的otherIndex下标为0
    var otherIndex = index--,
    desc = null;
 
    if (otherIndex == 1) {
        desc = 'first socket';
    } else {
        desc = 'second socket';
    }
 
    // 转发收到的消息
    ws.on('message', function(message) {
        var json = JSON.parse(message);
        console.log('received (' + desc + '): ', json);
 
        wsc[otherIndex].send(message, function (error) {
            if (error) {
                console.log('Send message error (' + desc + '): ', error);
            }
        });
    });
});
