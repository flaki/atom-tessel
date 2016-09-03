'use strict';

const SerialPort = require('serialport');

let port;

let flood = 0;
function find() {
  if (!flood) console.log('Searching for Tessel...');

  SerialPort.list(
    (err, l) => {
      let t2ports = l.filter(
        port => (port.manufacturer||'').match(/tessel/i)
      );

      if (err || !t2ports.length) {
        if (!flood) console.log('Tessel not found ', err||'');
        setTimeout(find, 100);
        flood++;
      } else {
        log(t2ports[0] ? t2ports[0].comName : null);
        let flood = 0;
      }
    }
  );
}

function log(comName) {
  if (!comName) {
    console.log('No serial Tessel connections found!');
    return;
  }

  port = new SerialPort(comName, {
    parser: SerialPort.parsers.readline('\n'),
    autoOpen: false
  });

  let onErrorRetry = (err => {
    console.log('Connection failed, retrying: ', err);

    if (err) {
      setTimeout(log.bind(undefined,comName), 100);
    }
  });
  let reconnect = () => {
    setTimeout(find, 100);
  }

  port.on('open', _ => {
    console.log('Serial console opened on '+comName);
    port.write(new Buffer('\n'));
  })
  port.on('error', _ => onErrorRetry);
  port.on('data', function (data) {
    console.log('> ' + data);
  });

  port.on('disconnect', _ => {
    console.log('Tessel disconnected');
  });
  port.on('close', _ => {
    console.log('Connection closed');
    //reconnect();
    find();
  });

  setTimeout(() => port.open(), 0);
}

find();

//setTimeout( () => port.write(new Buffer('pwd\r\n')), 1000);
//setTimeout( () => port.write(new Buffer('pwd\n')), 2000);

process.stdin.on( "data", function( chunk ) {
  if (!port) {
    return console.log('Cannot send command - Tessel disconnected!');
  }
  port.write(chunk);
});
