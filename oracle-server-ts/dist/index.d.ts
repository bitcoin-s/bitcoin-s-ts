import { OracleServerMessage } from './type/oracle-server-message';
import { OracleEvent, OracleResponse } from './type/oracle-server-types';
/** Set Oracle Server endpoint */
export declare function ConfigureOracleServerURL(url: string): void;
/** Send any OracleServerMessage */
export declare function SendOracleMessage(message: OracleServerMessage): Promise<OracleResponse<any>>;
export declare function GetPublicKey(): Promise<OracleResponse<string>>;
export declare function GetStakingAddress(): Promise<OracleResponse<string>>;
export declare function ListAnnouncements(): Promise<OracleResponse<string[]>>;
export declare function SignMessage(message: string): Promise<OracleResponse<string>>;
export declare function GetAnnouncement(eventName: string): Promise<OracleResponse<OracleEvent>>;
export declare function CreateEnumAnnouncement(eventName: string, maturationTimeISOString: string, outcomes: string[]): Promise<OracleResponse<string>>;
export declare function CreateNumericAnnouncement(eventName: string, maturationTimeISOString: string, minValue: number, maxValue: number, unit: string, precision: number): Promise<OracleResponse<string>>;
export declare function SignEnum(eventName: string, outcome: string): Promise<OracleResponse<string>>;
export declare function SignDigits(eventName: string, outcome: number): Promise<OracleResponse<string>>;
export declare function GetSignatures(eventName: string): Promise<OracleResponse<OracleEvent>>;
