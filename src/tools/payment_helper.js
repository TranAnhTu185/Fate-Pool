import pi_payment from "@/services/pi_payment.js";
import wld_payment from "@/services/wld_payment.js";
import telegram_payment from "@/services/telegram_payment.js";

export default {
    async pay(network, user_id, amount, data) {
        console.log(`${user_id} pay ${amount} - data: ${JSON.stringify(data)}, on network: ${network}`);
        if (network === "pi_network") {
            return await pi_payment.pay(network, user_id, amount, data);
        }
        if (network === "world_coin") {
            return wld_payment.pay(network, user_id, amount, data);
        }
        if (network === "telegram") {
            return telegram_payment.pay(network, user_id, amount, data);
        }
        return {
            rc: 1,
            rd: "Payment not success",
            amount: amount,
            network: network,
            tx: "0x" + Math.random().toString(36).substring(7),
            reference: Math.random().toString(36).substring(7)
        }
    }
}