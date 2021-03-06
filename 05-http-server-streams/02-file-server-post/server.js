const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const LimitSizeStream = require('./LimitSizeStream');
const {pipeline} = require('stream');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':
        if (pathname.indexOf('/') !== -1) {
            res.statusCode = 400;
            res.end('Nested path');
            return;
        }

        const limitStream = new LimitSizeStream({limit: 1000000});

        limitStream.on('error', function() {
            fs.unlink(filepath, () => {});
            res.statusCode = 413;
            res.end('the big file');
        });

        const writableStream = fs.createWriteStream(filepath, {flags: 'wx'});

        writableStream.on('error', function(err) {
            if (err.code === 'EEXIST') {
                res.statusCode = 409;
                res.end('file has already existed');
                return;
            }
            fs.unlink(filepath, () => {});
            res.statusCode = 500;
            res.end();
        });

        writableStream.on('close', () => {
            res.statusCode = 201;
            res.end('alright');
        });

        req.pipe(limitStream).pipe(writableStream);

        req.on('aborted', () => {
            fs.unlink(filepath, () => {});
            res.end();
        });

        break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
