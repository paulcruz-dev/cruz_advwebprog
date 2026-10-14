const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const express = require('express');
const sharp = require('sharp');
const uploadImageMiddleware = require('../middleware/uploadImageMiddleware');

let server;
let uploadUrl;

before(async () => {
    const app = express();
    app.post('/upload', uploadImageMiddleware, (request, response) => {
        response.status(200).json({ success: true });
    });

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    uploadUrl = `http://127.0.0.1:${server.address().port}/upload`;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

const upload = async (buffer, mimetype) => {
    const formData = new FormData();
    formData.append('image', new Blob([buffer], { type: mimetype }), 'upload');
    return fetch(uploadUrl, { method: 'POST', body: formData });
};

test('accepts a decodable PNG image', async () => {
    const png = await sharp({
        create: { width: 8, height: 8, channels: 3, background: 'red' }
    }).png().toBuffer();

    const response = await upload(png, 'image/png');
    assert.equal(response.status, 200);
});

test('rejects content that only claims to be a PNG', async () => {
    const response = await upload(Buffer.from('not an image'), 'image/png');
    assert.equal(response.status, 400);
});

test('rejects a corrupt image with a PNG signature', async () => {
    const fakePng = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.from('not a PNG image')
    ]);
    const response = await upload(fakePng, 'image/png');
    assert.equal(response.status, 400);
});

test('rejects unsupported MIME types', async () => {
    const response = await upload(Buffer.from('text'), 'text/plain');
    assert.equal(response.status, 400);
});

test('rejects images larger than 5 MB', async () => {
    const response = await upload(Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png');
    assert.equal(response.status, 413);
});