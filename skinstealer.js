import { writeFile } from 'node:fs';

const fetchWrapper = async (url, options = {}) => (console.log("fetch called:", url), fetch(url, options));

const fetchJSON = async (...args) => fetchWrapper(...args).then((response)=>response.json());
const fetchBytes = async (...args) => fetchWrapper(...args).then((response)=>response.bytes());

Array.prototype.chunk = function (size) {return this.reduce((acc, _, i) => (i % size)?acc:[...acc, this.slice(i, i + size)], []);};

Array.prototype.awaitAll = async function () {return await Promise.all(this);};

const getPlayerInfoBulk = async (batch) => fetchJSON("https://api.mojang.com/profiles/minecraft", {
    method: "POST",
    headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
    body: JSON.stringify(batch)
});

const getSkinInfo = async (uuid) => fetchJSON("https://sessionserver.mojang.com/session/minecraft/profile/"+uuid);
const getSkinURL = async (skinInfo) => JSON.parse(atob(skinInfo.properties.find((property)=>(property.name=="textures")).value)).textures.SKIN.url;
const getSkin = async (uuid) => getSkinInfo(uuid).then(getSkinURL).then(fetchBytes);
const downloadSkin = async (playerInfo) => writeFile("skins/" + playerInfo.name + ".png", await getSkin(playerInfo.id), (e) => null);
await process.argv.slice(2).chunk(10).map(getPlayerInfoBulk).awaitAll().then((players) => players.flat().map(downloadSkin));