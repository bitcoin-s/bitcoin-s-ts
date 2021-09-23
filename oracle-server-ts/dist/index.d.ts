import { OracleServerMessage } from './oracle-server-message';
import { OracleResponse } from './oracle-server-types';
/** Set Oracle Server endpoint */
export declare function ConfigureOracleServerURL(url: string): void;
/** Send any OracleServerMessage */
export declare function SendOracleMessage(message: OracleServerMessage): Promise<OracleResponse<any>>;
export declare function GetPublicKey(): Promise<OracleResponse<string>>;
export declare function GetStakingAddress(): Promise<OracleResponse<string>>;
export declare function ListEvents(): Promise<OracleResponse<string[]>>;
