import { createConfig, fallback, http, injected, unstable_connector } from "wagmi";
import { mainnet } from "wagmi/chains";

export const wagmiConfig = createConfig({
    chains: [mainnet],
    connectors: [injected()],
    transports: {
        [mainnet.id]: fallback([
            unstable_connector(injected),
            http("https://ethereum.publicnode.com"),
            http("https://cloudflare-eth.com"),
        ]),
    },
});
