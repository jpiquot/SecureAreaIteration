import {
    IWorkItemChangedArgs,
    IWorkItemFieldChangedArgs,
    IWorkItemFormService,
    IWorkItemLoadedArgs,
    IWorkItemNotificationListener,
    WorkItemField,
} from "../node_modules/azure-devops-extension-api/WorkItemTracking";

class SecuredFieldService {
    private workItemService: IWorkItemFormService;
    private areaFieldName: string = "System.AreaPath";
    private iterationFieldName: string = "System.IterationPath";
    private areaGroupName: string | null;
    private iterationGroupName: string | null;
    private isAreaUpdateMember: boolean;
    private isIterationUpdateMember: boolean;
    private areaDefaultValue: string | null;
    private iterationDefaultValue: string | null;

    public constructor(
        isAreaUpdateMember: boolean,
        isIterationUpdateMember: boolean,
        areaGroupName: string | null,
        iterationGroupName: string | null,
        areaDefaultValue: string | null,
        iterationDefaultValue: string | null,
        workItemService: IWorkItemFormService
    ) {
        this.workItemService = workItemService;
        this.isAreaUpdateMember = isAreaUpdateMember;
        this.areaGroupName = areaGroupName;
        this.iterationGroupName = iterationGroupName;
        this.isIterationUpdateMember = isIterationUpdateMember;
        this.areaDefaultValue = (areaDefaultValue) ? areaDefaultValue : null;
        this.iterationDefaultValue = (iterationDefaultValue) ? iterationDefaultValue : null;
    }
    private async secureField(fieldChangedArgs: IWorkItemFieldChangedArgs, fieldName: string, groupName: string, defaultValue: string | null): Promise<void> {
        const oldValue: string | null = await this.workItemService.getFieldValue(fieldName, { returnOriginalValue: true }) as string;
        const newValue: string | null = fieldChangedArgs.changedFields[fieldName] as string;
        let recoverValue: string | null = null;
        if (oldValue == null) {
            if (defaultValue != null) {
                recoverValue = defaultValue;
            }
        }
        else {
            if (newValue !== oldValue) {
                recoverValue = oldValue;
            }
        }
        if (recoverValue !== null) {
            var fields = await this.workItemService.getFields();
            var field: WorkItemField = fields.filter(x => x.referenceName === fieldName)[0];
            await this.workItemService.setError(
                "Only users in group '" +
                groupName +
                "' are allowed to change the field : "
                + field.name + "."
            );
            await SecuredFieldService.delay(2000);
            await this.workItemService.setFieldValue(fieldName, recoverValue);
            await this.workItemService.clearError();
        }
    }

    /**
     * Called when a field is modified
     *
     * @param fieldChangedArgs Information about the work item that was modified and the fields that were changed.
     */
    public onFieldChanged = async (
        fieldChangedArgs: IWorkItemFieldChangedArgs
    ): Promise<void> => {
        const fieldNames = Object.keys(fieldChangedArgs.changedFields);
        for (let i = 0; i < fieldNames.length; i++) {
            const field = fieldNames[i];
            if (!this.isAreaUpdateMember && field == this.areaFieldName && this.areaGroupName !== null) {
                await this.secureField(fieldChangedArgs, this.areaFieldName, this.areaGroupName, this.areaDefaultValue);
            }
            if (!this.isIterationUpdateMember && field == this.iterationFieldName && this.iterationGroupName !== null) {
                await this.secureField(fieldChangedArgs, this.iterationFieldName, this.iterationGroupName, this.iterationDefaultValue);
            }
        }
    };
    /**
     * Called when an extension is loaded
     *
     * @param workItemLoadedArgs Information about the work item that was loaded.
     */
    public onLoaded = async (_: IWorkItemLoadedArgs): Promise<void> => {
        return;
    };
    /**
     * Called when a work item is saved
     *
     * @param savedEventArgs Information about the work item that was saved.
     */
    public onSaved = async (_: IWorkItemChangedArgs): Promise<void> => {
        return;
    };
    /**
     * Called when a work item is unloaded
     *
     * @param unloadedEventArgs Information about the work item that was saved.
     */
    public onUnloaded = async (_: IWorkItemChangedArgs): Promise<void> => {
        return;
    };
    /**
     * Called when a work item is reset (undo back to unchanged state)
     *
     * @param undoEventArgs Information about the work item that was reset.
     */
    public onReset = async (_: IWorkItemChangedArgs): Promise<void> => {
        return;
    };
    /**
     * Called when a work item is refreshed
     *
     * @param refreshEventArgs Information about the work item that was refreshed.
     */
    public onRefreshed = async (_: IWorkItemChangedArgs): Promise<void> => {
        return;
    };
    public getProvider(): IWorkItemNotificationListener {
        return {
            onLoaded: this.onLoaded,
            onFieldChanged: this.onFieldChanged,
            onSaved: this.onSaved,
            onRefreshed: this.onRefreshed,
            onReset: this.onReset,
            onUnloaded: this.onUnloaded,
        };
    }
    private static delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export { SecuredFieldService };
