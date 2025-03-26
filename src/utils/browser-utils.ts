import * as forge from 'node-forge';

export interface Pkcs12Result {
  key: string;
  cert: string;
}

export async function readPkcs12FromBrowser(certData: Buffer | Uint8Array, password: string): Promise<Pkcs12Result> {
  try {
    const binaryStr = Array.from(new Uint8Array(certData instanceof Buffer ? certData.buffer : certData))
      .map(byte => String.fromCharCode(byte))
      .join('');

    const p12Asn1 = forge.asn1.fromDer(binaryStr);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });

    const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;
    const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert;

    if (!privateKey || !cert) {
      throw new Error('Não foi possível extrair a chave privada ou o certificado do PKCS#12');
    }

    const pemKey = forge.pki.privateKeyToPem(privateKey);
    const pemCert = forge.pki.certificateToPem(cert);

    return {
      key: pemKey,
      cert: pemCert,
    };
  } catch (error) {
    throw new Error(`Erro ao ler o certificado PKCS#12: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
} 