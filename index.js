import { registerCommand } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";

const fluxDispatcher = findByProps("dispatch", "subscribe");
const messageModule = findByProps("sendMessage");
const interactions = findByProps("createInteractionResponse", "getInteractionResponse") || 
                     findByProps("createInteractionResponse");

let activeChannelId = null;
let listening = false;
let isBuying = false;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function clickConfirm(message) {
    if (!interactions?.createInteractionResponse) {
        console.log("[Pokétwo Sniper] Módulo de interação não encontrado!");
        return;
    }

    const component = message.components?.[0]?.components?.[0]; 

    if (component?.custom_id) {
        try {
            await interactions.createInteractionResponse({
                messageId: message.id,
                interactionData: {
                    id: component.custom_id,
                    type: 3, 
                }
            });
            console.log(`[Pokétwo Sniper] Confirm clicado para ID ${message.id}`);
        } catch (e) {
            console.error("[Pokétwo Sniper] Erro ao clicar Confirm:", e);
        }
    }
}

function handleMessageNew({ message }) {
    if (!listening || message.channel_id !== activeChannelId) return;
    if (message.author.id !== "716390085896962058") return;

    const embed = message.embeds?.[0];
    if (!embed?.title?.includes("Pokétwo Marketplace")) return;

    const description = embed.description || "";
    const lines = description.split("\n");

    const toBuy = [];

    for (const line of lines) {
        const idMatch = line.match(/\*\*(\d+)\*\*/);
        const priceMatch = line.match(/([\d,]+)\s*pc/i);

        if (idMatch && priceMatch) {
            const itemId = idMatch[1];
            const price = parseInt(priceMatch[1].replace(/,/g, ""), 10);

            if (price < 200) {
                toBuy.push(itemId);
            }
        }
    }

    if (toBuy.length === 0) return;

    
    (async () => {
        if (isBuying) return;
        isBuying = true;
        listening = false; 

        for (let i = 0; i < toBuy.length; i++) {
            const itemId = toBuy[i];
            
            console.log(`[Pokétwo Sniper] Comprando ID ${itemId}...`);
            
            messageModule.sendMessage(activeChannelId, {
                content: `<@716390085896962058> m b ${itemId}`
            });

            
            await sleep(1500);
            
          
            await sleep(500);
        }

        await sleep(2000);
        isBuying = false;
        listening = true; 
        console.log(`[Pokétwo Sniper] Finalizada compra de ${toBuy.length} Pokémon.`);
    })();
}

export const onLoad = () => {
    registerCommand({
        name: "marketsniper",
        description: "Ativa sniper no mercado (compra < 200pc + auto confirm)",
        execute: async (_, ctx) => {
            activeChannelId = ctx.channel.id;
            listening = true;
            isBuying = false;

            console.log("[Pokétwo Sniper] Ativado!");

            await sleep(2000);

            messageModule.sendMessage(activeChannelId, {
                content: "<@716390085896962058> m s —n dedenne"
            });
        }
    });

    fluxDispatcher.subscribe("MESSAGE_CREATE", handleMessageNew);
};

export const onUnload = () => {
    fluxDispatcher.unsubscribe("MESSAGE_CREATE", handleMessageNew);
};
