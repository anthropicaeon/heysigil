import type {
    LaunchCreateRequest,
    LaunchListQuery,
    LaunchListResponse,
    MyProjectsResponse,
} from "../types.js";
import type { SigilHttpClient } from "../http.js";

export function createLaunchModule(http: SigilHttpClient) {
    return {
        create(input: LaunchCreateRequest) {
            return http.post<Record<string, unknown>>("/api/launch", input);
        },
        list(query?: LaunchListQuery) {
            const params = new URLSearchParams();
            if (query?.limit) params.set("limit", String(query.limit));
            if (query?.offset) params.set("offset", String(query.offset));
            if (query?.q) params.set("q", query.q);
            if (query?.platform) params.set("platform", query.platform);
            if (query?.sort) params.set("sort", query.sort);
            const suffix = params.toString();
            return http.get<LaunchListResponse>(`/api/launch/list${suffix ? `?${suffix}` : ""}`);
        },
        myProjects() {
            return http.get<MyProjectsResponse>("/api/launch/my-projects");
        },
        deployerStatus() {
            return http.get<Record<string, unknown>>("/api/launch/deployer");
        },
        project(projectId: string) {
            return http.get<Record<string, unknown>>(`/api/launch/${encodeURIComponent(projectId)}`);
        },
    };
}
