const path = require('path')

async function unzipFiles(req, res, renamed) {
    // Unzip file into myuploads folder
    var file_name;
    const f = await decompress(
      path.join(__dirname, "./myuploads/" + renamed),
      path.join(__dirname, "./myuploads/")
    ).then((files) => {
      file_name = files[0].path;
    });
    // Delete the zip folder after extracting files
    
    fs.unlink(path.join(__dirname, "./myuploads/" + renamed), function (err) {
      if (err) console.log(err);
    });
    console.log(renamed);
    console.log(file_name);
    const fileContentss = fs.readFileSync(
      path.join(__dirname, "./myuploads/" + file_name),
      "utf8"
    );
  
    whatsapp.parseString(fileContentss).then((messages) => {
      // delete file
      fs.unlink(path.join(__dirname, "./myuploads/" + file_name), function (err) {
        if (err) console.log("err", err);
      });
      return res.send(messages);
      // Do whatever you want with messages
    });
    // return res.json("ok");
  }