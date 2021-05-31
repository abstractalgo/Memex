import StorageManager, { OperationBatch } from '@worldbrain/storex'
import {
    PersonalCloudUpdatePushBatch,
    PersonalCloudUpdateType,
    PersonalCloudUpdatePush,
} from './types'
import {
    LocationSchemeType,
    ContentLocatorType,
    ContentLocatorFormat,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { PersonalContentLocator } from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'

// READ BEFORE EDITING
// `updates` comes from the client-side and can contain tampered data. As sunch,
// any use of data coming from `updates` should be handled with care. There are
// locally defined functions for a few common operations, like `findObjects` and
// `deleteObjects` that scope those operations down to users' personal data. Any
// direct usage of `storageManager` should be handled with care and security in mind.

export interface TranslationLayerDependencies {
    storageManager: StorageManager
    userId: number | string
    getNow(): number
}

export async function processClientUpdates(
    params: TranslationLayerDependencies & {
        updates: PersonalCloudUpdatePushBatch
    },
) {
    for (const update of params.updates) {
        await processClientUpdate({
            ...params,
            update,
        })
    }
}

async function processClientUpdate(
    params: TranslationLayerDependencies & {
        update: PersonalCloudUpdatePush
    },
) {
    const { storageManager } = params

    // NOTE: In any operation, userId should overwrite whatever is in the client-side provided object
    // to prevent users from overwriting each others' data
    const create = async (collection: string, toCreate: any) => {
        const now = params.getNow()
        const { object } = await storageManager
            .collection(collection)
            .createObject({
                ...toCreate,
                user: params.userId,
                createdByDevice: params.update.deviceId,
                createdWhen: now,
                updatedWhen: now,
            })
        return object
    }
    const findOrCreate = async (
        collection: string,
        where: any,
        defaults: any = {},
    ) => {
        const existing = await storageManager
            .collection(collection)
            .findObject({ ...where, user: params.userId })
        if (existing) {
            return existing
        }
        return create(collection, { ...where, ...defaults })
    }
    const findOne = async (collection: string, where: any) => {
        return storageManager
            .collection(collection)
            .findObject({ ...where, user: params.userId }) as any
    }
    const findMany = async (collection: string, where: any) => {
        return storageManager
            .collection(collection)
            .findObjects({ ...where, user: params.userId }) as any
    }
    const findContentLocator = async (normalizedUrl: string) => {
        const contentLocator: PersonalContentLocator & {
            id: string | number
            personalContentMetadata: string | number
        } = await findOne('personalContentLocator', {
            locationScheme: LocationSchemeType.NormalizedUrlV1,
            location: normalizedUrl,
        })
        return contentLocator
    }
    const findContentMetadata = async (normalizedUrl: string) => {
        const contentLocator = await findContentLocator(normalizedUrl)
        if (!contentLocator) {
            return { contentMetadata: null, contentLocator: null }
        }
        const contentMetadata = await findOne('personalContentMetadata', {
            id: contentLocator.personalContentMetadata,
        })
        return { contentMetadata, contentLocator }
    }
    const updateMany = async (collection: string, where: any, updates: any) => {
        await storageManager
            .collection(collection)
            .updateObjects(
                { ...where, user: params.userId },
                { ...updates, user: params.userId },
            )
    }
    const deleteMany = async (collection: string, where: any) => {
        await params.storageManager.collection(collection).deleteObjects({
            ...where,
            user: params.userId,
        })
    }

    const { update } = params
    if (update.collection === 'pages') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
            const page = update.object
            const normalizedUrl = page.url

            let { contentLocator, contentMetadata } = await findContentMetadata(
                normalizedUrl,
            )
            if (!contentLocator) {
                contentMetadata = await create('personalContentMetadata', {
                    canonicalUrl: page.canonicalUrl,
                    title: page.fullTitle,
                })
                contentLocator = await create('personalContentLocator', {
                    personalContentMetadata: contentMetadata.id,
                    locationType: ContentLocatorType.Remote,
                    locationScheme: LocationSchemeType.NormalizedUrlV1,
                    format: ContentLocatorFormat.HTML,
                    location: normalizedUrl,
                    originalLocation: page.fullUrl,
                    version: 0, // later, when visits are written, this is updated
                    valid: true,
                    primary: true,
                })
            } else if (contentMetadata) {
                await updateMany(
                    'personalContentMetadata',
                    { id: contentMetadata.id },
                    {
                        canonicalUrl: page.canonicalUrl,
                        title: page.fullTitle,
                    },
                )
            }
        } else if (update.type === PersonalCloudUpdateType.Delete) {
            const normalizedUrl = update.where.url as string
            const firstConttentLocator = await findContentLocator(normalizedUrl)
            if (!firstConttentLocator) {
                return
            }
            const allContentLocators = await findMany(
                'personalContentLocator',
                {
                    personalContentMetadata:
                        firstConttentLocator.personalContentMetadata,
                },
            )
            const batch: OperationBatch = [
                {
                    placeholder: 'metadata',
                    operation: 'deleteObjects',
                    collection: 'personalContentMetadata',
                    where: {
                        user: params.userId,
                        id: firstConttentLocator.personalContentMetadata,
                    },
                },
            ]
            for (const [
                locatorIndex,
                contentLocator,
            ] of allContentLocators.entries()) {
                batch.push({
                    placeholder: `locator-${locatorIndex}`,
                    operation: 'deleteObjects',
                    collection: 'personalContentLocator',
                    where: {
                        user: params.userId,
                        id: contentLocator.id,
                    },
                })
            }
            await storageManager.operation('executeBatch', batch)
        }
    } else if (update.collection === 'visits') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
            const visit = update.object
            const normalizedUrl = visit.url
            const {
                contentMetadata,
                contentLocator,
            } = await findContentMetadata(normalizedUrl)
            if (!contentMetadata) {
                return
            }
            await create('personalContentRead', {
                personalContentMetadata: contentMetadata.id,
                personalContentLocator: contentLocator.id,
                readWhen: visit.time,
                readDuration: visit.duration ?? null,
                progressPercentage: visit.scrollPerc ?? null,
                scrollTotal: visit.scrollMaxPx ?? null,
                scrollProgress: visit.scrollPx ?? null,
            })
        } else if (update.type === PersonalCloudUpdateType.Delete) {
        }
    } else if (update.collection === 'tags') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
            const tagName = update.object.name
            const normalizedUrl = update.object.url

            const tag = await findOrCreate('personalTag', { name: tagName })

            const { contentMetadata } = await findContentMetadata(normalizedUrl)
            if (!contentMetadata) {
                return
            }

            await findOrCreate('personalTagConnection', {
                personalTag: tag.id,
                collection: 'personalContentMetadata',
                objectId: contentMetadata.id,
            })
        } else if (update.type === PersonalCloudUpdateType.Delete) {
            const tagName = update.where.name
            const normalizedUrl = update.where.url

            const [tag, { contentMetadata }] = await Promise.all([
                findOne('personalTag', {
                    name: tagName,
                }),
                findContentMetadata(normalizedUrl as string),
            ])
            if (!tag || !contentMetadata) {
                return
            }

            await deleteMany('personalTagConnection', {
                peronalTag: tag.id,
                personalContentMetadata: contentMetadata.id,
            })
        }
    } else if (update.collection === 'customLists') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
        } else if (update.type === PersonalCloudUpdateType.Delete) {
        }
    } else if (update.collection === 'pageListEntries') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
        } else if (update.type === PersonalCloudUpdateType.Delete) {
        }
    }
}
