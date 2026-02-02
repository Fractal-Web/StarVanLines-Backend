

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

let blockCounter = 0;

export const log = (level, message, data = null) => {
    blockCounter++;
    const timestamp = new Date().toISOString();
    let color = colors.reset;

    switch (level.toLowerCase()) {
        case 'info': color = colors.green; break;
        case 'warn': color = colors.yellow; break;
        case 'error': color = colors.red; break;
        case 'debug': color = colors.cyan; break;
    }

    console.log(`\n${colors.bright}-------- LOG BLOCK ${blockCounter} --------${colors.reset}`);
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${colors.reset}`);

    if (data) {
        if (typeof data === 'object') {
            try {
                console.log(JSON.stringify(data, null, 2));
            } catch (e) {
                console.log(data);
            }
        } else {
            console.log(data);
        }
    }
    console.log(`${colors.bright}--------------------------------${colors.reset}\n`);
};

export const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    req.requestId = requestId;

    // Capture original send to log response body
    const originalSend = res.send;
    let responseBody;
    res.send = function (chunk) {
        if (chunk) responseBody = chunk;
        return originalSend.apply(res, arguments);
    };

    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, url, body, query, headers } = req;

        // Create a clean headers object (redact sensitive info)
        const cleanHeaders = { ...headers };
        ['authorization', 'cookie', 'token', 'x-api-key'].forEach(h => {
            if (cleanHeaders[h]) cleanHeaders[h] = '[REDACTED]';
        });

        log('INFO', `Request Finished: ${method} ${url} ${res.statusCode} (${duration}ms)`, {
            requestId,
            request: {
                headers: cleanHeaders,
                query,
                body
            },
            response: {
                statusCode: res.statusCode,
                body: (() => {
                    try {
                        return JSON.parse(responseBody);
                    } catch (e) {
                        return responseBody;
                    }
                })()
            }
        });
    });

    next();
};
