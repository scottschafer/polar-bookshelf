import * as React from 'react';
import {RepoDocMetaLoader} from '../RepoDocMetaLoader';
import {RepoDocMetaManager} from '../RepoDocMetaManager';
import {IDocInfo} from '../../../../web/js/metadata/DocInfo';
import {SyncBarProgress} from '../../../../web/js/ui/sync_bar/SyncBar';
import {IEventDispatcher} from '../../../../web/js/reactor/SimpleReactor';
import {PersistenceLayerManager} from '../../../../web/js/datastore/PersistenceLayerManager';
import {RepoHeader} from '../repo_header/RepoHeader';
import {MessageBanner} from '../MessageBanner';
import {RepoAnnotation} from '../RepoAnnotation';
import {FixedNav} from '../FixedNav';
import PreviewAndMainViewDock from './PreviewAndMainViewDock';
import {Dock} from '../../../../web/js/ui/dock/Dock';
import {TagTree} from '../../../../web/js/ui/tree/TagTree';
import {NULL_FUNCTION} from '../../../../web/js/util/Functions';
import {UpdatedCallback} from './AnnotationRepoFilterEngine';
import {AnnotationRepoFilterEngine} from './AnnotationRepoFilterEngine';
import {PersistenceLayerManagers} from '../../../../web/js/datastore/PersistenceLayerManagers';
import {RepoDocMetaLoaders} from '../RepoDocMetaLoaders';
import {Channels} from '../../../../web/js/util/Channels';
import {AnnotationRepoFilters} from './AnnotationRepoFiltersHandler';
import {ChannelFunction} from '../../../../web/js/util/Channels';
import {ChannelCoupler} from '../../../../web/js/util/Channels';
import ReleasingReactComponent from '../framework/ReleasingReactComponent';
import {TagDescriptor} from '../../../../web/js/tags/TagNode';

export default class AnnotationRepoApp extends ReleasingReactComponent<IProps, IState> {

    private readonly filterChannel: ChannelFunction<AnnotationRepoFilters>;

    private readonly setFilterChannel: ChannelCoupler<AnnotationRepoFilters>;

    constructor(props: IProps, context: any) {
        super(props, context);

        [this.filterChannel, this.setFilterChannel]
            = Channels.create<AnnotationRepoFilters>();

        this.state = {
            data: [],
            tags: []
        };

        this.init();

    }
    public init() {

        // FIXME: this code need to be move to the parent so that it can
        //  setState every time the entire app reloads

        const setStateInBackground = (state: IState) => {

            setTimeout(() => {

                console.log("FIXME setting state... ", state.tags);

                // The react table will not update when I change the state from
                // within the event listener
                this.setState(state);

            }, 1);

        };

        const onUpdated: UpdatedCallback = repoAnnotations => {

            const tags = this.props.repoDocMetaManager.tagsDB.tags()
                .map(current => {
                    const count = Math.floor(Math.random() * 100); // FIXME
                    return {...current, count};
                });

            const state = {...this.state, data: repoAnnotations, tags};
            setStateInBackground(state);

        };

        const repoAnnotationsProvider =
            () => Object.values(this.props.repoDocMetaManager!.repoAnnotationIndex);

        const filterEngine = new AnnotationRepoFilterEngine(repoAnnotationsProvider, onUpdated);

        // this will trigger the filter engine to be run which will then call
        // onUpdated which then calls setState
        this.setFilterChannel(filters => filterEngine.onFiltered(filters));

        const doRefresh = () => filterEngine.onProviderUpdated();

        PersistenceLayerManagers.onPersistenceManager(this.props.persistenceLayerManager, (persistenceLayer) => {

            this.releaser.register(
                persistenceLayer.addEventListener(() => doRefresh()));

        });

        this.releaser.register(
            RepoDocMetaLoaders.addThrottlingEventListener(this.props.repoDocMetaLoader, () => doRefresh()));

        // do an initial refresh to get the first batch of data.
        doRefresh();

    }

    public render() {

        return (

            <FixedNav id="doc-repository"
                      className="annotations-view">

                <header>
                    <RepoHeader persistenceLayerManager={this.props.persistenceLayerManager}/>

                    <MessageBanner/>

                </header>


                <Dock left={
                    <div style={{display: 'flex' ,
                                 flexDirection: 'column',
                                 height: '100%',
                                 overflow: 'auto'}}>

                        <div className="m-1">
                            <TagTree tags={this.state.tags} onSelected={NULL_FUNCTION}/>
                        </div>

                    </div>
                  }
                  right={
                      <PreviewAndMainViewDock  data={this.state.data} filterChannel={this.filterChannel} {...this.props}/>
                  }
                  side='left'
                  initialWidth={200}/>


            </FixedNav>

        );
    }

}

export interface IProps {

    readonly persistenceLayerManager: PersistenceLayerManager;

    readonly updatedDocInfoEventDispatcher: IEventDispatcher<IDocInfo>;

    readonly syncBarProgress: IEventDispatcher<SyncBarProgress>;

    readonly repoDocMetaManager: RepoDocMetaManager;

    readonly repoDocMetaLoader: RepoDocMetaLoader;
}

export interface IState {

    readonly repoAnnotation?: RepoAnnotation;

    readonly data: ReadonlyArray<RepoAnnotation>;

    readonly tags: ReadonlyArray<TagDescriptor>;

}

