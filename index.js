const express = require('express');
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server);
const spawn = require('child_process').spawn;
const AU = new require('ansi_up');
const ansi = new AU.default();

let ps = runStern();

server.listen('9008', '0.0.0.0', () => {
  console.log(`Listening on ${9008}...`);
});

app.use('/', (req, res, next) => {
  return res.sendFile(__dirname + '/index.html');
});


io.on('connection', function (socket) {
  console.log('IO CONNECTION')

  function subscribe() {
    ps.stdout.on('data', function (data) {
      data.split('\n').forEach((line) => {
        let log = line.split(' ');
        log.splice(0, 2);
        log = ansi.ansi_to_html(log.join(' '));
        if (/88,88,88| message: | stack: |Error/.test(log)) {
          socket.emit('log', (log));
          // console.log(JSON.stringify(log));
        }
      });
    });

    socket.emit('log', '[subscribed]');
  }
  subscribe();

  socket.on('reset', function (data) {
    console.log(data);
    ps.kill();
    ps = runStern();
    subscribe();
  });
});

function runStern() {
  const ps = spawn('stern', [ '--since', '1s', 'node' ]);

  ps.stdout.setEncoding('utf-8');
  ps.stdout.pipe(process.stdout);
  // ps.stderr.pipe(process.stderr);

  return ps;
}
