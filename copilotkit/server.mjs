import { HttpAgent } from "@ag-ui/client";
import {
    CopilotRuntime,
    copilotRuntimeNodeExpressEndpoint,
    EmptyAdapter,
} from '@copilotkit/runtime';
import cors from "cors";
import express from "express";

const serviceAdapter = new EmptyAdapter();

const runtime = new CopilotRuntime({
    agents: {
        aika: new HttpAgent({ url: "http://localhost:8000/" }),
    }
});

const copilotRuntime = copilotRuntimeNodeExpressEndpoint({
    endpoint: "/",
    runtime,
    serviceAdapter,
    logLevel: "debug",
});

const app = express();

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["*"],
    }),
);

// Uncomment this line to parse the request body
// app.use(express.json());

app.use("/copilotkit", copilotRuntime);


app.use((req, res, next) => {
    res.status(404);

    console.error(`404 on request to ${req.path}`)

    // respond with html page
    if (req.accepts('html')) {
        res.render('404', { url: req.url });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.json({ error: 'Not found' });
        return;
    }

    res.type('txt').send('Not found');
})

app.listen(4000, () => {
    console.log("Listening at http://localhost:4000/copilotkit");
});