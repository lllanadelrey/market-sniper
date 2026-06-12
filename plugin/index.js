(() => {
    const { metro, commands } = window.vendetta;
    
    const fluxDispatcher = metro.findByProps("dispatch", "subscribe");
    const messageModule = metro.findByProps("sendMessage", "receiveMessage");
    const interactions = metro.findByProps("createInteractionResponse", "getInteractionResponse") || 
                         metro.findByProps("createInteractionResponse");

    let activeChannelId = null;
    let listening = false;
    let isBuying = false;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function clickConfirm(message) {
        if (!interactions?.createInteractionResponse) return;

        const component = message.components?.[0]?.components?.[0];

        if (component?.custom_id) {
            try {
                await interactions.createInteractionResponse({
                    messageId: message.id,
                    interactionData: {
                        id: component.custom_id,
                        type: 3 
                    }
                });
            } catch (e) {
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
                
                messageModule.sendMessage(activeChannelId, {
                    content: `<@716390085896962058> m b ${itemId}`
                });

                await sleep(1500);
                await sleep(500);
            }

            await sleep(2000);
            isBuying = false;
            listening = true; 
        })();
    }

    window.marketSniperPlugin = {
        onLoad: () => {
            commands.registerCommand({
                name: "marketsniper",
                description: "Ativa o monitoramento do mercado",
                execute: async (_, ctx) => {
                    activeChannelId = ctx.channel.id;
                    listening = true;
                    isBuying = false;

                    await sleep(2000);

                    messageModule.sendMessage(activeChannelId, {
                        content: "<@716390085896962058> m s —n dedenne"
                    });
                }
            });

            fluxDispatcher.subscribe("MESSAGE_CREATE", handleMessageNew);
        },
        onUnload: () => {
            fluxDispatcher.unsubscribe("MESSAGE_CREATE", handleMessageNew);
        }
    };

    return window.marketSniperPlugin;
})();
