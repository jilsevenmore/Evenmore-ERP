import { persistContractSigning } from './contractService';

import { signingRequest } from '../utils/contractSigningRequest';

export async function manageContractSigning(id, action, body) {
  const data = await signingRequest(`contract-signing/${encodeURIComponent(id)}${action ? `/${action}` : ''}`, body, true);
  try { persistContractSigning(id, data); }
  catch { throw new Error('The server saved the signing record, but the local CRM could not be updated. Free browser storage and refresh signing status to recover.'); }
  return data;
}
