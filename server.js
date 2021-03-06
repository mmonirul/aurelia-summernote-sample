import express from "express"
import bodyParser from "body-parser"
import serveStatic from "serve-static"
import multer from "multer"
import path from "path"
import fs from "fs"
import prominence from "prominence"
import cron from "cron"
import Rx from "rxjs-fs"
import argv from "argv"

let args = argv.option([
	{ name: 'port', short: 'p', type: 'int' }
]).run();

let app = express();
let port = args.options.port || 3000;
let upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	next();
});
app.use(serveStatic(__dirname));

let onUpload = async function(req, res) {
	let file = req.file;
	let extension = path.extname(file.originalname).toLowerCase();
	console.log(">>> uploaded...");
	console.log(req.file);
	console.log(">>> params...");
	console.log(req.body);

	// append extension to filename.
	await prominence(fs).rename(file.path, file.path + extension);

	res.json({
		url: `/uploads/${file.filename}${extension}`
	});
};

app.post('/api/upload', upload.single('file'), onUpload);

app.listen(port, () => {
	console.log("listening http on port " + port)
});

// to continue demonstration...
cron.job('0 0 * * * *', () => {
	console.log("clean uploads...");
	Rx.fs.ls('uploads').filter(x => x.extension !== '.gitkeep').forEach(x => fs.unlink(x.path));
});
