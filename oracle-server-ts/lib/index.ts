import { BehaviorSubject, forkJoin, from, Observable, of, timer } from 'rxjs'
import { delayWhen, retryWhen, switchMap, tap } from 'rxjs/operators'

import { SendServerMessage, GetVersion } from 'common-ts/index.js'
import { ServerResponse, VersionResponse } from 'common-ts/type/server-types'
import { getMessageBody } from 'common-ts/util/message-util.js'
import { validateISODateString, validateNumber, validateString } from 'common-ts/util/validation-util.js'

import { MessageType, OracleAnnouncement, OracleEvent, OracleResponse } from './type/oracle-server-types'
import { validateEnumOutcomes } from './util/validation-util.js'

// Expose all 'common' endpoints
export * from 'common-ts/index.js'
import { PollingLoopObs } from 'common-ts/index.js'

const DEBUG = true // log actions in console.debug

const OFFLINE_POLLING_TIME = 5000 // ms

/** Oracle Server State Holding */

export interface OracleStateModel { // extends CommonStateModel possible?
  version: string
  publicKey: string
  stakingAddress: string
  oracleName: string
}

class OracleStateImpl /*extends CommonStateImpl*/ implements OracleStateModel {
  version: string
  publicKey: string
  stakingAddress: string
  oracleName: string
}

const state = new BehaviorSubject<OracleStateModel>(new OracleStateImpl())
/** Exposed OracleState */
export const OracleState = state.asObservable()
/** Clear OracleTS OracleState */
export function ClearOracleState() {
  state.next(new OracleStateImpl())
}

type OracleServerAnnouncementMap = { [eventName: string]: OracleAnnouncement }

// Announcement state
const announcementNames: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([])
const announcements: BehaviorSubject<OracleServerAnnouncementMap> = new BehaviorSubject({})
const flatAnnouncements: BehaviorSubject<OracleAnnouncement[]> = new BehaviorSubject<OracleAnnouncement[]>([])

/** Exposed Announcement State */
export const Announcements = flatAnnouncements.asObservable()
/** Clear OracleTS Announcement State */
export function ClearAnnouncementState() {
  announcementNames.next([])
  announcements.next({})
  flatAnnouncements.next([])
}

function updateFlatAnnouncements() {
  flatAnnouncements.next([...flatAnnouncements.value])
}

function addEventToState(a: OracleAnnouncement|null) {
  if (a) {
    announcements.value[a.eventName] = a
    flatAnnouncements.value.push(a)
  }
}

/** OracleTS Support Functions */

/** Detect that backend is available and ready for interaction */
export function WaitForServer() {
  if (DEBUG) console.debug('WaitForServer()')

  return PollingLoopObs()
}

/** Load all data in OracleState and Announcement data */
export function InitializeOracleState() {
  return forkJoin([
    getServerVersion(),
    getPublicKey(),
    getStakingAddress(),
    getOracleName(),
    GetAllAnnouncementsAndDetails(), // could require separate call to init
  ]).pipe(tap(results => {
    if (DEBUG) console.debug('InitializeOracleState()', results)
  }))
}

/** Observable wrapped GetVersion() state fn */
function getServerVersion() {
  // if (DEBUG) console.debug('getServerVersion()')
  return from(<Promise<ServerResponse<VersionResponse>>>GetVersion()).pipe(tap(r => {
    if (r.result) {
      if (DEBUG) console.debug('getServerVersion()', r.result.version)
      const s = state.getValue()
      s.version = r.result.version
      state.next(s)
    }
  }))
}

/** Observable wrapped GetPublicKey() state fn */
function getPublicKey() {
  return from(GetPublicKey()).pipe(tap(r => {
    if (r.result) {
      if (DEBUG) console.debug('getPublicKey()', r.result)
      const s = state.getValue()
      s.publicKey = r.result
      state.next(s)
    }
  }))
}

/** Observable wrapped GetStakingAddress() state fn */
function getStakingAddress() {
  return from(GetStakingAddress()).pipe(tap(r => {
    if (r.result) {
      if (DEBUG) console.debug('getStakingAddress()', r.result)
      const s = state.getValue()
      s.stakingAddress = r.result
      state.next(s)
    }
  }))
}

/** Observable wrapped GetOracleName() state fn */
function getOracleName() {
  return from(GetOracleName()).pipe(tap(r => {
    if (r.result) {
      if (DEBUG) console.debug('getOracleName()', r.result)
      const s = state.getValue()
      s.oracleName = r.result
      state.next(s)
    }
  }))
}

/** Observable wrapped ListAnnouncements then getAllAnnouncementDetails() */
export function GetAllAnnouncementsAndDetails(): Observable<OracleResponse<OracleEvent>[] | null> {
  if (DEBUG) console.debug('GetAllAnnouncementsAndDetails()')
  flatAnnouncements.next([])
  const obs = from(ListAnnouncements())
    .pipe(tap(r => {
      if (r.result) {
        announcementNames.next(<string[]>r.result)
      }
    }), switchMap(_ => getAllAnnouncementDetails()),
    tap(r => {
      if (r) {
        for (const e of r) {
          addEventToState(<OracleAnnouncement>e.result)
        }
        updateFlatAnnouncements()
      }
    })
    // , switchMap(_ => getAnnouncementsFromOracleExplorer())
    )
  return obs
}

/** Observable wrapped GetAnnouncement for all announcementNames */
function getAllAnnouncementDetails() {
  if (DEBUG) console.debug('getAllAnnouncementDetails()')
  if (announcementNames.value.length > 0) {
    const obs = forkJoin(announcementNames.value.map(a => GetAnnouncement(a)))
    obs.pipe(tap(r => {
      if (r) {
        for (const e of r) {
          addEventToState(<OracleAnnouncement>e.result)
        }
        updateFlatAnnouncements()
      }
    }))
    return obs
  }
  return of(null)
}

/** Reloads an Announcement after signing to update field values */
export function ReloadAnnouncement(a: OracleAnnouncement) {
  console.debug('ReloadAnnouncement()', a)
  // Remove previous event state
  const i = flatAnnouncements.value.findIndex(i => i.eventName === a.eventName)
  if (i !== -1) {
    flatAnnouncements.value.splice(i, 1)
  }
  let announcement: OracleAnnouncement|null = null
  const obs = from(GetAnnouncement(a.eventName))
    .pipe(tap(r => {
      if (r.result) {
        announcement = <OracleAnnouncement>r.result
        addEventToState(announcement)
        updateFlatAnnouncements()
      }
    })
    , switchMap(_ => of(announcement))
    )
  return obs
}

/** Specific Oracle Server message functions */

export function GetPublicKey(): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('GetPublicKey()')

  const m = getMessageBody(MessageType.getpublickey)
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}

export function GetStakingAddress(): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('GetStakingAddress()')

  const m = getMessageBody(MessageType.getstakingaddress)
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}

export function ExportStakingAddressWIF(): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('ExportStakingAddressWIF()')

  const m = getMessageBody(MessageType.exportstakingaddresswif)
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}

export function ListAnnouncements(): Promise<OracleResponse<string[]>> {
  if (DEBUG) console.debug('ListAnnouncements()')

  const m = getMessageBody(MessageType.listannouncements)
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string[]>>response
  })
}

export function SignMessage(message: string): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('SignMessage()', message)
  validateString(message, 'SignMessage()', 'message')

  const m = getMessageBody(MessageType.signmessage, [message])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}

export function GetAnnouncement(eventName: string): Promise<OracleResponse<OracleEvent>> {
  if (DEBUG) console.debug('GetAnnouncement()', eventName)
  validateString(eventName, 'GetAnnouncement()', 'eventName')

  const m = getMessageBody(MessageType.getannouncement, [eventName])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<OracleEvent>>response
  })
}
 
export function CreateEnumAnnouncement(eventName: string,
    maturationTimeISOString: string, outcomes: string[]): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('CreateEnumAnnouncement()', eventName, maturationTimeISOString, outcomes)
  validateString(eventName, 'CreateEnumAnnouncement()', 'eventName')
  validateISODateString(maturationTimeISOString, 'CreateEnumAnnouncement()', 'maturationTimeISOString')
  validateEnumOutcomes(outcomes, 'CreateEnumAnnouncement()')

  const m = getMessageBody(MessageType.createenumannouncement, [eventName, maturationTimeISOString, outcomes])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}

export function CreateNumericAnnouncement(eventName: string, 
    maturationTimeISOString: string, minValue: number, maxValue: number,
    unit: string, precision: number): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('CreateNumericAnnouncement()', eventName, maturationTimeISOString, minValue, maxValue, unit, precision)
  validateString(eventName, 'CreateNumericAnnouncement()', 'eventName')
  validateISODateString(maturationTimeISOString, 'CreateNumericAnnouncement()', 'maturationTimeISOString')
  validateNumber(minValue, 'CreateNumericAnnouncement()', 'minValue')
  validateNumber(maxValue, 'CreateNumericAnnouncement()', 'maxValue')
  // TODO : Validate minValue/maxValue?
  validateString(unit, 'CreateNumericAnnouncement()', 'unit') // unit can be an empty string
  validateNumber(precision, 'CreateNumericAnnouncement()', 'precision')
  if (precision < 0) throw(Error('CreateNumericAnnouncement() precision must be >= 0'))

  const m = getMessageBody(MessageType.createnumericannouncement, [eventName, maturationTimeISOString, minValue, maxValue, unit, precision])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}

export function SignEnum(eventName: string, outcome: string): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('SignEnum()', eventName, outcome)
  validateString(eventName, 'SignEnum()', 'eventName')
  validateString(outcome, 'SignEnum()', 'outcome')

  const m = getMessageBody(MessageType.signenum, [eventName, outcome])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}

export function SignDigits(eventName: string, outcome: number): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('SignDigits()', eventName, outcome)
  validateString(eventName, 'SignDigits()', 'eventName')
  validateNumber(outcome, 'SignDigits()', 'outcome')

  const m = getMessageBody(MessageType.signdigits, [eventName, outcome])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}

export function GetSignatures(eventName: string): Promise<OracleResponse<OracleEvent>> {
  if (DEBUG) console.debug('GetSignatures()', eventName)
  validateString(eventName, 'GetSignatures()', 'eventName')

  const m = getMessageBody(MessageType.getsignatures, [eventName])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<OracleEvent>>response
  })
}

export function DeleteAnnouncement(eventName: string): Promise<OracleResponse<OracleEvent>> {
  if (DEBUG) console.debug('DeleteAnnouncement()', eventName)
  validateString(eventName, 'DeleteAnnouncement()', 'eventName')

  const m = getMessageBody(MessageType.deleteannouncement, [eventName])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<OracleEvent>>response
  })
}

export function DeleteAttestation(eventName: string): Promise<OracleResponse<OracleEvent>> {
  if (DEBUG) console.debug('DeleteAttestation()', eventName)
  validateString(eventName, 'DeleteAttestation()', 'eventName')

  const m = getMessageBody(MessageType.deleteattestation, [eventName])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<OracleEvent>>response
  })
}

export function GetOracleName(): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('GetOracleName()')

  const m = getMessageBody(MessageType.getoraclename)
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}

export function SetOracleName(oracleName: string): Promise<OracleResponse<string>> {
  if (DEBUG) console.debug('SetOracleName()', oracleName)

  const m = getMessageBody(MessageType.setoraclename, [oracleName])
  return SendServerMessage(m).then(response => {
    return <OracleResponse<string>>response
  })
}
