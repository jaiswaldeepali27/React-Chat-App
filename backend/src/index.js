import { server } from './lib/socket.js';
const PORT = process.env.PORT;

server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
