import { getEnv } from "../../config/env.js";

const RAILWAY_GRAPHQL_URL = "https://backboard.railway.app/graphql/v2";

interface GraphQlResponse<T> {
    data?: T;
    errors?: Array<{ message: string }>;
}

interface RailwayServiceCreateData {
    serviceCreate?: {
        id: string;
        name?: string | null;
        projectId?: string | null;
    };
}

interface RailwayDeployData {
    serviceInstanceRedeploy?: {
        id: string;
    };
}

export interface RailwayProvisionResult {
    projectId: string;
    serviceId: string;
    deploymentId: string;
    endpoint: string;
    minimumResources: {
        cpuMillicores: number;
        memoryMb: number;
    };
}

export function isRailwayProvisionerConfigured(): boolean {
    const env = getEnv();
    return !!(env.RAILWAY_API_TOKEN && env.RAILWAY_PROJECT_ID && env.RAILWAY_ENVIRONMENT_ID);
}

async function requestRailwayGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const env = getEnv();
    if (!env.RAILWAY_API_TOKEN) {
        throw new Error("RAILWAY_API_TOKEN is not configured");
    }

    const response = await fetch(RAILWAY_GRAPHQL_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.RAILWAY_API_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error(`Railway API request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as GraphQlResponse<T>;
    if (payload.errors && payload.errors.length > 0) {
        throw new Error(payload.errors[0]?.message || "Railway API returned an error");
    }
    if (!payload.data) {
        throw new Error("Railway API returned no data");
    }
    return payload.data;
}

export async function provisionSigilBotRuntime(input: {
    userId: string;
    stack: "sigilbot" | "openclaw";
    mcpToken: string;
    connectSecret?: string;
}): Promise<RailwayProvisionResult> {
    const env = getEnv();
    if (!isRailwayProvisionerConfigured()) {
        throw new Error("Railway provisioner is not configured");
    }

    const suffix = input.userId.slice(-8).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const timestamp = Date.now().toString(36);
    const serviceName = `${env.RAILWAY_SERVICE_NAME_PREFIX}-${suffix}-${timestamp}`;

    // Create service in existing Railway project.
    const serviceCreateData = await requestRailwayGraphql<RailwayServiceCreateData>(
        `
          mutation ServiceCreate($input: ServiceCreateInput!) {
            serviceCreate(input: $input) {
              id
              name
              projectId
            }
          }
        `,
        {
            input: {
                projectId: env.RAILWAY_PROJECT_ID,
                name: serviceName,
                source: {
                    repo: "heysigil/heysigil",
                    branch: "main",
                    rootDirectory: "packages/sigilbot",
                },
            },
        },
    );

    const serviceId = serviceCreateData.serviceCreate?.id;
    if (!serviceId) {
        throw new Error("Railway service creation did not return a service ID");
    }

    // Inject runtime env vars required by sigilbot package.
    await requestRailwayGraphql(
        `
          mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
            variableCollectionUpsert(input: $input) {
              id
            }
          }
        `,
        {
            input: {
                projectId: env.RAILWAY_PROJECT_ID,
                environmentId: env.RAILWAY_ENVIRONMENT_ID,
                serviceId,
                variables: {
                    SIGIL_API_URL: env.BASE_URL,
                    SIGIL_MAIN_APP_URL: env.FRONTEND_URL,
                    SIGIL_MCP_TOKEN: input.mcpToken,
                    SIGIL_BOT_STACK: input.stack,
                    SIGIL_BOT_ID: serviceName,
                    SIGIL_CONNECT_SHARED_SECRET: input.connectSecret || "",
                },
            },
        },
    );

    // Enforce minimum resource profile policy.
    await requestRailwayGraphql(
        `
          mutation ServiceInstanceUpdate($input: ServiceInstanceUpdateInput!) {
            serviceInstanceUpdate(input: $input) {
              id
            }
          }
        `,
        {
            input: {
                projectId: env.RAILWAY_PROJECT_ID,
                environmentId: env.RAILWAY_ENVIRONMENT_ID,
                serviceId,
                resources: {
                    cpu: env.RAILWAY_MIN_CPU_MILLICORES,
                    memory: env.RAILWAY_MIN_MEMORY_MB,
                },
            },
        },
    );

    const deployData = await requestRailwayGraphql<RailwayDeployData>(
        `
          mutation ServiceInstanceRedeploy($input: ServiceInstanceRedeployInput!) {
            serviceInstanceRedeploy(input: $input) {
              id
            }
          }
        `,
        {
            input: {
                projectId: env.RAILWAY_PROJECT_ID,
                environmentId: env.RAILWAY_ENVIRONMENT_ID,
                serviceId,
            },
        },
    );

    const deploymentId = deployData.serviceInstanceRedeploy?.id;
    if (!deploymentId) {
        throw new Error("Railway deployment did not return a deployment ID");
    }

    // Railway commonly exposes `<service>.up.railway.app` domains.
    const endpoint = `https://${serviceName}.up.railway.app`;

    return {
        projectId: env.RAILWAY_PROJECT_ID,
        serviceId,
        deploymentId,
        endpoint,
        minimumResources: {
            cpuMillicores: env.RAILWAY_MIN_CPU_MILLICORES,
            memoryMb: env.RAILWAY_MIN_MEMORY_MB,
        },
    };
}
