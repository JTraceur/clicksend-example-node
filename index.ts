//Scripted 13th October 2020 by Jack Bruce for Clicksend Support and Integration Developer position.

//Imports:
import * as cs from 'clicksend';
import * as readline from 'readline';
import Prompts from 'prompt-sync'
import { readFileSync } from 'fs';

//Setup to handle user inputs:
const prompt = Prompts({ sigint: true });

const username = prompt('Enter your clicksend API Username: ');
const apiKey = prompt('Enter your clicksend API Key: ');

//API Ini:
var mmsAPI = new cs.MMSApi(username, apiKey);
var uploadAPI = new cs.UploadApi(username, apiKey);

//Load environment variables:
var eV = JSON.parse(
        readFileSync('environment vars.json').toString()
);

//Main process:
async function __main__() {
    let mediaURL:string = await uploadMedia(username, apiKey, eV.pictureFilePath);
    sendMessage(mediaURL);
}

//Convert image file to send:
async function uploadMedia(_username:string, _apiKey:string, filePath: string): Promise<string> {

    /*
    *   I realise that I could've just used any old image URL.
    *   But I wanted to explore the API some more so I decided to see if I could also host the image on the Clicksend platform and then send it that way.
    */

    //Setup upload file:
    var uploadFile = new cs.UploadFile();
    
    //Convert file to base64:
    uploadFile.content = readFileSync(filePath, {encoding: 'base64'});

    //Wait for upload and return URL:
    let uploadedMedia: Promise<any> = uploadAPI.uploadsPost(uploadFile, 'mms');
    let response = await uploadedMedia;
    let dataObj = JSON.parse(JSON.stringify(response.body)); // Convert response body to JSON object.
    return dataObj.data._url;
}

function sendMessage(mediaURL: string) {

    //Setup new message:
    var message = new cs.MmsMessage();

    //Load enviroment vars into message:
    message.to = eV.sendTo;
    message.from = eV.sentFrom;
    message.subject = "Msg Test";
    message.body = `Hello, this is ${eV.senderName} completing the code test for ${eV.senderQuest} role. Checkout my code at: ${eV.githubURL}`;

    //Package message into sendable message:
    var mmsMessages = new cs.MmsMessageCollection();
    mmsMessages.mediaFile = mediaURL;
    mmsMessages.messages = [message];

    //Send the message:
    console.log('Sending message...')
    let sendingMessage: Promise<{ body: string }> = mmsAPI.mmsSendPost(mmsMessages);

    //Message is OK:
    sendingMessage.then((response) => {
        
        /*
        *   I noticed that the `sendingMessage` can still resolve but still fail to send the message serverside, 
        *   which is why the below is necessary. (i.e You forget to include a subject in the message.)
        */

        //Check server response:
        let msg = JSON.parse(JSON.stringify(response.body)).data.messages[0];
        if (msg.status === 'SUCCESS'){
            console.log('OK: Message successfully sent! :)');
        }
        else {
            console.log('ERR: Server could not send message. :(');
        }
        
        //Exit program
        process.exit(0);
    });

    //Message failed:
    sendingMessage.catch((err) => {

        console.log(`Message failed to send: ${JSON.stringify(err.body)}`);

        //Exit program
        process.exit(0);
    })
}

//Run main process:
__main__();