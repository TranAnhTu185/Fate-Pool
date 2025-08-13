export default {
    async pay(network, user_id, amount, data) {
        console.log(`${user_id} pay ${amount} - data: ${JSON.stringify(data)}, on network: ${network}`);
        return {
            rc: 1,
            rd: "Payment WLD not success",
            amount: amount,
            network: network,
            tx: "0x" + Math.random().toString(36).substring(7),
            reference: Math.random().toString(36).substring(7)
        }
    }
}