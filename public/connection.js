/**
 * Wrapper for client-side TikTok connection over Socket.IO
 * With reconnect functionality.
 */
class TikTokIOConnection {
    constructor(backendUrl, sessionId) {  // Terima sessionId sebagai parameter
        this.socket = io(backendUrl);
        this.uniqueId = null;
        this.options = null;
        this.sessionId = sessionId;  // Simpan sessionId

        this.socket.on('connect', () => {
            console.info("Socket connected!");

            // Gunakan sessionId untuk request polling
            if (this.sessionId) {
                this.setSessionId();  // Panggil fungsi setSessionId
            }

            // Reconnect to streamer if uniqueId already set
            if (this.uniqueId) {
                this.setUniqueId();
            }
        })

        this.socket.on('disconnect', () => {
            console.warn("Socket disconnected!");
        })

        this.socket.on('streamEnd', () => {
            console.warn("LIVE has ended!");
            this.uniqueId = null;
        })

        this.socket.on('tiktokDisconnected', (errMsg) => {
            console.warn(errMsg);
            if (errMsg && errMsg.includes('LIVE has ended')) {
                this.uniqueId = null;
            }
        });
    }

    // Fungsi untuk menggunakan sessionId
    setSessionId() {
        this.socket.emit('setSessionId', this.sessionId);  // Emit sessionId ke server
    }

    connect(uniqueId, options) {
        this.uniqueId = uniqueId;
        this.options = options || {};

        if (this.sessionId) {
            this.setSessionId();  // Panggil setSessionId jika sessionId tersedia
        }

        this.setUniqueId();

        return new Promise((resolve, reject) => {
            this.socket.once('tiktokConnected', resolve);
            this.socket.once('tiktokDisconnected', reject);

            setTimeout(() => {
                reject('Connection Timeout');
            }, 15000)
        })
    }

    setUniqueId() {
        this.socket.emit('setUniqueId', this.uniqueId, this.options);
    }

    on(eventName, eventHandler) {
        this.socket.on(eventName, eventHandler);
    }
}

