const qrcode = require('qrcode-terminal');

const fs = require('fs');
const axios = require('axios');

const parentfolder = '/Users/Noy/Desktop/latex-whatsapp/' //change to your directory

const path = parentfolder + 'temp.svg'
const helppath = parentfolder + 'help.jpg'
const errpath = parentfolder + 'error.png'

async function downloadImage (url, imagePath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(imagePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

const { Client, MessageTypes, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
    authStrategy : new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message_create', message => {
	console.log(message.body);
    console.log("sent in " + message.from + " by " + message.author);
    
    if(message.body=="!help"){
        const content = MessageMedia.fromFilePath(help);
        message.reply(content,null,{
            sendMediaAsSticker : true,
            stickerAuthor : 'Whatsapp LaTex Renderer',
            stickerName : 'Help'
        });
    }
    
    if(message.body.startsWith("!t ")){
        const tex = message.body.slice(3);
        const url = 'https://latex.codecogs.com/svg.image?' + encodeURI(tex);
        //const url = 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Cat_demonstrating_static_cling_with_styrofoam_peanuts.jpg';

        console.log(url);
        downloadImage(url,path).then(res => {
            //manipulate file to make it white
            const svgcontent = fs.readFileSync(path, 'utf-8');

            const updated = svgcontent.replace('<svg', '<svg fill="white"')

            fs.writeFileSync(path, updated, 'utf-8', err2 => {
              if (err2) {
                console.log(err2)
              }
            })

            //send message
            const content = MessageMedia.fromFilePath(path);
            message.reply(content,null,{
                sendMediaAsSticker : true,
                stickerAuthor : 'Whatsapp LaTex Renderer',
                stickerName : tex
            });

        }, err => {
            const content = MessageMedia.fromFilePath(errpath);
            message.reply(content,null,{
                sendMediaAsSticker : true,
                stickerAuthor : 'Whatsapp LaTex Renderer',
                stickerName : 'ERROR'
            });
        })
    /*if(message.body.startsWith("!help")){
        const content = MessageMedia.fromFilePath(helppath);
        message.reply(content,null,{
            sendMediaAsSticker : true,
            stickerAuthor : 'Whatsapp LaTex Renderer',
            stickerName : 'help'
        });
    }*/ 
};
})

client.initialize();
