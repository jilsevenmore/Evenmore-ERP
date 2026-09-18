import { useEffect, useState } from 'react';
import { getProofFile, previewKindFor } from './proofFileStore';

/**
 * Loads the device file attached to a proof and hands back a blob URL the
 * viewer can point at. The URL is revoked when the key changes or the component
 * unmounts, so a long proofing session does not leak object URLs.
 *
 * Returns null while loading or when no file is attached — callers fall back to
 * the schematic preview.
 */
export function useProofFile(fileKey) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(Boolean(fileKey));

  useEffect(() => {
    if (!fileKey) {
      setFile(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    let url = null;
    setLoading(true);

    getProofFile(fileKey).then((record) => {
      if (cancelled || !record?.blob) {
        if (!cancelled) {
          setFile(null);
          setLoading(false);
        }
        return;
      }
      url = URL.createObjectURL(record.blob);
      setFile({
        url,
        fileName: record.fileName,
        mimeType: record.mimeType,
        size: record.size,
        kind: previewKindFor(record.mimeType, record.fileName),
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileKey]);

  return { file, loading };
}

export default useProofFile;
