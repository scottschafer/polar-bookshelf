import * as React from 'react';
import {FixedNav, FixedNavBody} from '../FixedNav';
import {RepoHeader} from '../repo_header/RepoHeader';
import {PersistenceLayerManager} from '../../../../web/js/datastore/PersistenceLayerManager';
import {Group, Groups} from "../../../../web/js/datastore/sharing/db/Groups";
import {Logger} from "../../../../web/js/logger/Logger";
import {GroupsTable} from "./GroupsTable";

const log = Logger.create();

export class GroupsScreen extends React.Component<IProps, IState> {

    constructor(props: IProps, context: any) {
        super(props, context);

        this.state = {
            groups: []
        };

    }


    public componentWillMount(): void {

        const doHandle = async (): Promise<void> => {

            const groups = await Groups.topGroups();

            this.setState({groups});

        };

        doHandle().catch(err => log.error("Unable to get groups: ", err));

    }

    public render() {

        return (

            <FixedNav id="doc-repository">

                <header>

                    <RepoHeader persistenceLayerManager={this.props.persistenceLayerManager}/>

                </header>

                <FixedNavBody className="container">

                    <div className="row">

                        <div className="col">

                            <div style={{display: 'flex'}}
                                 className="w-100 mt-3">

                                <div style={{flexGrow: 1}}>
                                    <h3>Groups</h3>
                                </div>

                                <div className="text-right">
                                    <a href="#groups/create"
                                       className="btn btn-success btn-sm">Create Group</a>
                                </div>


                            </div>

                            <GroupsTable persistenceLayerManager={this.props.persistenceLayerManager}
                                         groups={this.state.groups}/>

                        </div>

                    </div>

                </FixedNavBody>

            </FixedNav>

        );
    }

}

export interface IProps {
    readonly persistenceLayerManager: PersistenceLayerManager;
}

export interface IState {
    readonly groups: ReadonlyArray<Group>;
}
