import { HttpAgent } from "@ag-ui/client";
import {
    CopilotRuntime,
    copilotRuntimeNodeHttpEndpoint,
    EmptyAdapter,
} from '@copilotkit/runtime';
import express from 'express';

const app = express();

const serviceAdapter = new EmptyAdapter();


const runtime = new CopilotRuntime({
    agents: {
        my_agent: new HttpAgent({ url: "http://localhost:8000/" }),
    }
});

app.use('/copilotkit', copilotRuntimeNodeHttpEndpoint({
    endpoint: '/copilotkit',
    runtime,
    serviceAdapter,
}));

app.listen(4000, () => {
    console.log('Listening at http://localhost:4000/copilotkit');
});