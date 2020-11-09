import { IExtensionDataManager } from "azure-devops-extension-api";

/**
 * Class that facilitates saving settings to VSS.
 * Settings can either be saved on Project or Organization level.
 */
export class SettingsData {
    /** Key that is used to store the team group that can make changes to the area field. */
    public static readonly SECURE_AREA_UPDATE_TEAM = "fiveforty-secure-area-team";

    /** Key that is used to store the team group that can make changes to the iteration field. */
    public static readonly SECURE_ITERATION_UPDATE_TEAM =
        "fiveforty-secure-iteration-team";

    /** Key that is used to store the area field default value. */
    public static readonly SECURE_AREA_DEFAULT_VALUE = "fiveforty-secure-area-default";

    /** Key that is used to store the iteration field default value. */
    public static readonly SECURE_ITERATION_DEFAULT_VALUE =
        "fiveforty-secure-iteration-default";

    private readonly projectId: string;
    private dataService: IExtensionDataManager;

    constructor(dataService: IExtensionDataManager, projectId: string) {
        this.dataService = dataService;
        this.projectId = projectId;
    }

    private async getValue(fieldName: string): Promise<string | null> {
        try {
            const value = await this.dataService.getValue(fieldName + "-" + this.projectId) as string;
            return (value) ? value : null;
        }
        catch
        {
            console.warn('Field value not found : ' + fieldName);
            return null;
        }
    }
    public async setAreaUpdateTeam(value: string): Promise<string> {
        return this.dataService.setValue(
            SettingsData.SECURE_AREA_UPDATE_TEAM + "-" + this.projectId,
            value
        );
    }
    public async setIterationUpdateTeam(value: string): Promise<string> {
        return this.dataService.setValue(
            SettingsData.SECURE_ITERATION_UPDATE_TEAM + "-" + this.projectId,
            value
        );
    }

    public async getAreaUpdateTeam(): Promise<string | null> {
        return await this.getValue(SettingsData.SECURE_AREA_UPDATE_TEAM);
    }

    public async getIterationUpdateTeam(): Promise<string | null> {
        return await this.getValue(SettingsData.SECURE_ITERATION_UPDATE_TEAM);
    }

    public async setAreaDefaultValue(value: string): Promise<string> {
        return this.dataService.setValue(
            SettingsData.SECURE_AREA_DEFAULT_VALUE + "-" + this.projectId,
            value
        );
    }
    public async setIterationDefaultValue(value: string): Promise<string> {
        return this.dataService.setValue(
            SettingsData.SECURE_ITERATION_DEFAULT_VALUE + "-" + this.projectId,
            value
        );
    }

    public async getAreaDefaultValue(): Promise<string | null> {
        return await this.getValue(SettingsData.SECURE_AREA_DEFAULT_VALUE);
    }

    public async getIterationDefaultValue(): Promise<string | null> {
        return await this.getValue(SettingsData.SECURE_ITERATION_DEFAULT_VALUE);
    }

}
