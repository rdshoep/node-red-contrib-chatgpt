module.exports = (RED) => {
    const {
        Configuration,
        OpenAIApi
    } = require("openai");
    const ACCEPT_TOPIC_LIST = ["completion", "image", "edit", "turbo", "gpt4"];
    const main = function (config) {
        const node = this;
        RED.nodes.createNode(node, config);
        const API_KEY = config.API_KEY;
        const ORGANIZATION = config.Organization;

        const configuration = new Configuration({
            organization: ORGANIZATION,
            apiKey: API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        node.on('input', async(msg) => {
            node.status({
                fill: "green",
                shape: "dot",
                text: "Processing..."
            });

            const topic = (!config.topic || config.topic === "__EMPTY__") ? msg.topic : config.topic;
            if (ACCEPT_TOPIC_LIST.indexOf(topic) < 0) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "msg.topic is incorrect"
                });
                node.error(`msg.topic must be ${ACCEPT_TOPIC_LIST.map(item => `'${item}'`).join(", ")}`)
                node.send(msg)
            } else if (topic === "image") {
                try {
                    const response = await openai.createImage({
                        prompt: msg.payload,
                        n: msg.n || 1,
                        size: msg.size || "256x256",
                        response_format: msg.format || "b64_json",
                    });
                    if (msg.format === "url") {
                        msg.payload = response.data.data[0].url;
                    } else {
                        msg.payload = response.data.data[0].b64_json;
                    }

                    msg.full = response;
                    node.status({
                        fill: "blue",
                        shape: "dot",
                        text: "Response complete"
                    });
                    node.send(msg)
                } catch (error) {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Error"
                    });
                    if (error.response) {
                        node.error(error.response.status);
                        node.error(error.response.data);
                    } else {
                        node.error(error.message);
                    }
                }
            } else if (topic === "edit") {
                try {
                    const response = await openai.createEdit({
                        model: "text-davinci-edit-001",
                        instruction: msg.payload,
                        n: msg.n || 1,
                        input: msg.last || "",
                        temperature: msg.temperature || 1,
                        top_p: msg.top_p || 1
                    });
                    msg.payload = response.data.choices[0].text;
                    msg.full = response;
                    node.status({
                        fill: "blue",
                        shape: "dot",
                        text: "Response complete"
                    });
                    node.send(msg)
                } catch (error) {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Error"
                    });
                    if (error.response) {
                        node.error(error.response.status);
                        node.error(error.response.data);
                    } else {
                        node.error(error.message);
                    }
                }
            } else if (topic === "turbo") {
                try {
                    if (typeof msg.history === "undefined")
                        msg.history = [];
                    msg.topic = "turbo";
                    const input = {
                        "role": "user",
                        "content": msg.payload
                    };
                    msg.history.push(input);
                    const response = await openai.createChatCompletion({
                        model: "gpt-3.5-turbo",
                        messages: msg.history,
                        temperature: msg.temperature || 1,
                        top_p: msg.top_p || 1,
                        n: msg.n || 1,
                        stream: msg.stream || false,
                        stop: msg.stop || null,
                        max_tokens: msg.max_tokens || 4000,
                        presence_penalty: msg.presence_penalty || 0,
                        frequency_penalty: msg.frequency_penalty || 0
                    });
                    const trimmedContent = response.data.choices[0].message.content.trim();
                    const result = {
                        "role": "assistant",
                        "content": trimmedContent
                    };
                    msg.history.push(result);
                    msg.payload = response.data.choices[0].message.content;
                    msg.full = response;
                    node.status({
                        fill: "blue",
                        shape: "dot",
                        text: "Response complete"
                    });
                    node.send(msg)
                } catch (error) {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Error"
                    });
                    if (error.response) {
                        node.error(error.response.status);
                        node.error(error.response.data);
                    } else {
                        node.error(error.message);
                    }
                }
            } else if (topic === "gpt4") {
                try {
                    if (typeof msg.history === "undefined")
                        msg.history = [];
                    msg.topic = "gpt4";
                    const input = {
                        "role": "user",
                        "content": msg.payload
                    };
                    msg.history.push(input);
                    const response = await openai.createChatCompletion({
                        model: "gpt-4",
                        messages: msg.history,
                        temperature: msg.temperature || 1,
                        top_p: msg.top_p || 1,
                        n: msg.n || 1,
                        stream: msg.stream || false,
                        stop: msg.stop || null,
                        max_tokens: msg.max_tokens || 4000,
                        presence_penalty: msg.presence_penalty || 0,
                        frequency_penalty: msg.frequency_penalty || 0
                    });
                    const trimmedContent = response.data.choices[0].message.content.trim();
                    const result = {
                        "role": "assistant",
                        "content": trimmedContent
                    };
                    msg.history.push(result);
                    msg.payload = response.data.choices[0].message.content;
                    msg.full = response;
                    node.status({
                        fill: "blue",
                        shape: "dot",
                        text: "Response complete"
                    });
                    node.send(msg)
                } catch (error) {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Error"
                    });
                    if (error.response) {
                        node.error(error.response.status);
                        node.error(error.response.data);
                    } else {
                        node.error(error.message);
                    }
                }
            } else {
                try {
                    msg.topic = "completion";
                    const response = await openai.createCompletion({
                        model: "text-davinci-003",
                        prompt: msg.payload,
                        suffix: msg.suffix || null,
                        max_tokens: msg.max_tokens || 4000,
                        temperature: msg.temperature || 1,
                        top_p: msg.top_p || 1,
                        n: msg.n || 1,
                        stream: msg.stream || false,
                        logprobs: msg.logprobs || null,
                        echo: msg.echo || false,
                        stop: msg.stop || null,
                        presence_penalty: msg.presence_penalty || 0,
                        frequency_penalty: msg.frequency_penalty || 0,
                        best_of: msg.best_of || 1
                    });
                    msg.payload = response.data.choices[0].text;
                    msg.full = response;
                    node.status({
                        fill: "blue",
                        shape: "dot",
                        text: "Response complete"
                    });
                    node.send(msg)
                } catch (error) {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Error"
                    });
                    if (error.response) {
                        node.error(error.response.status);
                        node.error(error.response.data);
                    } else {
                        node.error(error.message);
                    }
                }
            }
        });
    }

    RED.nodes.registerType("chatgpt", main);
}
