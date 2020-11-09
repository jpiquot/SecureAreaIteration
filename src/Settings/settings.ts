import { CommonServiceIds, IExtensionDataService, IProjectPageService } from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";
import { SettingsData } from "./SettingsData";
import "./settings.css";

class program {
    public static settings: SettingsData
    public static async run() {
        await SDK.init({
            applyTheme: true,
            loaded: false,
        });
        await SDK.ready();
        const extension: SDK.IExtensionContext = SDK.getExtensionContext();
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (project === undefined) {
            throw Error("No project defined.");
        }
        const dataService = await SDK.getService<IExtensionDataService>(
            CommonServiceIds.ExtensionDataService
        );
        this.settings = new SettingsData(await dataService.getExtensionDataManager(extension.id, await SDK.getAccessToken()), project.id);
        this.initForm();
        SDK.notifyLoadSucceeded();
    }
    private static async getField(name: string): Promise<HTMLInputElement> {
        const field = document.querySelector('[name="' + name + '"]') as HTMLInputElement;
        if (field === null) {
            throw Error("The form query field with name " + name + " was not found.");
        }
        return field;
    }
    private static async getAreaTeamField(): Promise<HTMLInputElement> {
        return await this.getField("area-update-team");
    }
    private static async getIterationTeamField(): Promise<HTMLInputElement> {
        return await this.getField("iteration-update-team");
    }
    private static async getAreaDefaultField(): Promise<HTMLInputElement> {
        return await this.getField("area-default");
    }
    private static async getIterationDefaultField(): Promise<HTMLInputElement> {
        return await this.getField("iteration-default");
    }
    private static async initForm(): Promise<void> {
        const areaDefaultField = await program.getAreaDefaultField();
        const areaDefaultValue = await program.settings.getAreaDefaultValue();
        if (areaDefaultValue === null) {
            areaDefaultField.value = "";
        }
        else {
            areaDefaultField.value = areaDefaultValue;
        }
        const areaTeamField = await program.getAreaTeamField();
        const areaTeamValue = await program.settings.getAreaUpdateTeam();
        if (areaTeamValue === null) {
            areaTeamField.value = "";
        }
        else {
            areaTeamField.value = areaTeamValue;
        }
        const iterationDefaultField = await program.getIterationDefaultField();
        const iterationDefaultValue = await program.settings.getIterationDefaultValue();
        if (iterationDefaultValue === null) {
            iterationDefaultField.value = "";
        }
        else {
            iterationDefaultField.value = iterationDefaultValue;
        }
        const iterationTeamField = await program.getIterationTeamField();
        const iterationTeamValue = await program.settings.getIterationUpdateTeam();
        if (iterationTeamValue === null) {
            iterationTeamField.value = "";
        }
        else {
            iterationTeamField.value = iterationTeamValue;
        }
        const button = document.getElementById('secure-area-iteration-button');
        if (button === null) {
            throw Error("The form element was not found.");
        }
        button.addEventListener('click', async (e: Event): Promise<void> => {
            e.preventDefault();
            const areaTeam = await program.getAreaTeamField();
            await program.settings.setAreaUpdateTeam(areaTeam.value);
            const iterationTeam = await program.getIterationTeamField();
            await program.settings.setIterationUpdateTeam(iterationTeam.value);
            const areaDefault = await program.getAreaDefaultField();
            await program.settings.setAreaDefaultValue(areaDefault.value);
            const iterationDefault = await program.getIterationDefaultField();
            await program.settings.setIterationDefaultValue(iterationDefault.value);
        })
    }
}


program.run();
