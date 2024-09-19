const qrcode = require('qrcode-terminal');

const fs = require('fs');
const axios = require('axios');

const path = 'temp.svg'
const helpmessage = fs.readFileSync('help.txt','utf8')
var config = JSON.parse(fs.readFileSync('config.json','utf8'))

async function downloadImage(url, imagePath) {
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
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message_create', message => {
    console.log(message.body);
    console.log("sent in " + message.from + " by " + message.author);
    let chat = message.getChat()

    if (message.body.trimEnd() == "!thelp") {
        /*const content = MessageMedia.fromFilePath('help.png');
        message.reply(content,null,{
            sendMediaAsSticker : true,
            stickerAuthor : 'Whatsapp LaTex Renderer',
            stickerName : 'Help'
        });*/

        message.reply(helpmessage)
    }

    if(message.body.trimEnd()=="!enabletex"){
        const id = message.from
        if(config.disabledchats.includes(id)){
            config.disabledchats.splice(config.disabledchats.indexOf(id),1)
            fs.writeFileSync('config.json',JSON.stringify(config))
            message.reply("LaTeX rendering enabled")
        } else {
            message.reply("Rendering is already enabled for this chat")
        }
    }

    if(message.body.trimEnd()=="!disabletex"){
        const id = message.from
        console.log(id);
        if(!config.disabledchats.includes(id)){
            config.disabledchats.push(id)
            fs.writeFileSync('config.json',JSON.stringify(config))
            message.reply("LaTeX rendering disabled")
        } else {
            message.reply("Rendering is already disabled for this chat")
        }
    }

   if (message.body.startsWith("!t ") && !config.disabledchats.includes(message.getChat().id)) {
        const tex = message.body.slice(3);
        const url = 'https://latex.codecogs.com/svg.image?' + encodeURI(tex);
        //const url = 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Cat_demonstrating_static_cling_with_styrofoam_peanuts.jpg';

        console.log(url);
        downloadImage(url, path).then(res => {
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
            message.reply(content, null, {
                sendMediaAsSticker: true,
                stickerAuthor: 'Whatsapp LaTex Renderer',
                stickerName: tex
            });

        }, err => {
            const content = MessageMedia.fromFilePath('error.png');
            message.reply(content, null, {
                sendMediaAsSticker: true,
                stickerAuthor: 'Whatsapp LaTex Renderer',
                stickerName: 'ERROR'
            });
        })
    }
})

client.initialize();
