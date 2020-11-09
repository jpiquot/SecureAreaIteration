import {
    IWorkItemChangedArgs,
    IWorkItemFieldChangedArgs,
    IWorkItemFormService,
    IWorkItemLoadedArgs,
    IWorkItemNotificationListener,
    WorkItemTrackingServiceIds,
} from "azure-devops-extension-api/WorkItemTracking";

import {
    CommonServiceIds,
    getClient,
    IExtensionDataService,
    IProjectPageService
} from "azure-devops-extension-api";

import {
    CoreRestClient
} from "azure-devops-extension-api/Core";

import * as SDK from "azure-devops-extension-sdk";
import { SecuredFieldService } from "./SecuredFieldService";
import { SettingsData } from "./Settings/SettingsData";
import { TeamMember } from "azure-devops-extension-api/WebApi";

interface IGroupMembership {
    AreaUpdateMember: boolean;
    IterationUpdateMember: boolean;
}
//enum GroupType {
//    Other = 0,
//    Area = 1,
//    Iteration = 2
//}
class program {
    public static async run() {
        await SDK.init({
            applyTheme: true,
            loaded: false,
        });
        await SDK.ready();
        const user: SDK.IUserContext = SDK.getUser();
        const workItemFormService = await SDK.getService<IWorkItemFormService>(
            WorkItemTrackingServiceIds.WorkItemFormService
        );
        const project = await (await SDK.getService<IProjectPageService>(
            CommonServiceIds.ProjectPageService
        )).getProject();

        if (project === undefined) {
            throw Error("No project defined.");
        }
        const extension: SDK.IExtensionContext = SDK.getExtensionContext();
        const dataService = await SDK.getService<IExtensionDataService>(
            CommonServiceIds.ExtensionDataService
        );
        const settings = new SettingsData(await dataService.getExtensionDataManager(extension.id, await SDK.getAccessToken()), project.id);
        const areaUpdateTeam = await settings.getAreaUpdateTeam();
        const iterationUpdateTeam = await settings.getIterationUpdateTeam();
        if (!areaUpdateTeam && !iterationUpdateTeam) {
            // If the area and iteration update groups don't exist for the project, do not secure area and iteration fields.
            // There is no need to register notifications in tha case.
            return;
        }
        const coreClient: CoreRestClient = getClient(CoreRestClient);

        //        user.descriptor = (await client.getDescriptor(user.id)).value;
        //        console.log("User : " + user.name + ". descriptor: " + user.descriptor);
        const groupMembership: IGroupMembership = { AreaUpdateMember: true, IterationUpdateMember: true };
        if (areaUpdateTeam && !(await this.isTeamMember(coreClient, user.id, project.id, areaUpdateTeam))) {
            groupMembership.AreaUpdateMember = false;
        }
        if (iterationUpdateTeam && !(await this.isTeamMember(coreClient, user.id, project.id, iterationUpdateTeam))) {
            groupMembership.IterationUpdateMember = false;
        }
        if (groupMembership.AreaUpdateMember === true && groupMembership.IterationUpdateMember === true) {
            // If the user has update privileges on the two fields, no need to register a notification
            return;
        }
        const securedFielService = new SecuredFieldService(
            groupMembership.AreaUpdateMember,
            groupMembership.IterationUpdateMember,
            areaUpdateTeam,
            iterationUpdateTeam,
            await settings.getAreaDefaultValue(),
            await settings.getIterationDefaultValue(),
            workItemFormService);
        SDK.register(SDK.getContributionId(), async (): Promise<IWorkItemNotificationListener> => {
            return {
                onFieldChanged: async (
                    fieldChangedArgs: IWorkItemFieldChangedArgs
                ): Promise<void> => await securedFielService.onFieldChanged(fieldChangedArgs),
                onLoaded: async (workItemLoadedArgs: IWorkItemLoadedArgs): Promise<void> => await securedFielService.onLoaded(workItemLoadedArgs),
                onSaved: async (savedEventArgs: IWorkItemChangedArgs): Promise<void> => await securedFielService.onSaved(savedEventArgs),
                onRefreshed: async (refreshEventArgs: IWorkItemChangedArgs): Promise<void> => await securedFielService.onRefreshed(refreshEventArgs),
                onReset: async (undoEventArgs: IWorkItemChangedArgs): Promise<void> => await securedFielService.onReset(undoEventArgs),
                onUnloaded: async (unloadedEventArgs: IWorkItemChangedArgs): Promise<void> => await securedFielService.onUnloaded(unloadedEventArgs)
            }
        });
        SDK.notifyLoadSucceeded();
    }
    private static async isTeamMember(client: CoreRestClient, userId: string, projectId: string, teamId: string): Promise<boolean> {
        const list: TeamMember[] = await client.getTeamMembersWithExtendedProperties(projectId, teamId);
        for (let i = 0; i < list.length; i++) {
            const member: TeamMember = list[i];
            if (member.identity.id === userId) {
                return true;
            }
        }
        return false;
    }
}

program.run();
