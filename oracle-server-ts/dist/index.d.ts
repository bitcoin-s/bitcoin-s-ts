import { OracleServerMessage } from './oracle-server-message';
import { OracleEvent, OracleResponse } from './oracle-server-types';
/** Set Oracle Server endpoint */
export declare function ConfigureOracleServerURL(url: string): void;
/** Send any OracleServerMessage */
export declare function SendOracleMessage(message: OracleServerMessage): Promise<OracleResponse<any>>;
export declare function GetPublicKey(): Promise<OracleResponse<string>>;
export declare function GetStakingAddress(): Promise<OracleResponse<string>>;
export declare function ListEvents(): Promise<OracleResponse<string[]>>;
export declare function SignMessage(message: string): Promise<OracleResponse<string>>;
export declare function GetEvent(eventName: string): Promise<OracleResponse<OracleEvent>>;
export declare function CreateEnumEvent(eventName: string, maturationTimeISOString: string, outcomes: string[]): Promise<OracleResponse<string>>;
export declare function CreateNumericEvent(eventName: string, maturationTimeISOString: string, minValue: number, maxValue: number, unit: string, precision: number): Promise<OracleResponse<string>>;
export declare function SignEvent(eventName: string, outcome: string): Promise<OracleResponse<string>>;
export declare function SignDigits(eventName: string, outcome: number): Promise<OracleResponse<string>>;
export declare function GetSignatures(eventName: string): Promise<OracleResponse<OracleEvent>>;
