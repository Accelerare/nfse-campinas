import { XMLParser } from 'fast-xml-parser';
import { SignedXml } from 'xml-crypto';
import { ComputeSignatureOptions } from 'xml-crypto/lib/types';
import xmlbuilder from 'xmlbuilder';
import {
    createClientAsync,
    NotaFiscalSoapClient,
    TnsCancelarNfse,
    TnsConsultarLoteRps,
    TnsConsultarNfseFaixa,
    TnsConsultarNfsePorRps,
    TnsConsultarNfseServicoPrestado,
    TnsConsultarNfseServicoTomado,
    TnsGerarNfse,
    TnsRecepcionarLoteRps,
    TnsRecepcionarLoteRpsSincrono,
    TnsSubstituirNfse,
} from '../soap/notafiscalsoap';
import { ReferenceOptions } from '../types/nfseCampinas';
import { Pkcs12Result, readPkcs12FromBrowser } from '../utils/browser-utils';

export class NfseCampinas {
  readonly defaultOptions: ReferenceOptions = {
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
    uri: 'rps@1',
  };
  private soapClient: NotaFiscalSoapClient | null = null;
  private readonly host: string;
  private readonly certificate: Buffer | Uint8Array;
  private readonly certificatePassword: string;
  private readonly debug: boolean;

  constructor(
    host: string,
    certificate: Buffer | Uint8Array,
    certificatePassword: string,
    debug = false,
  ) {
    this.host = host;
    this.certificate = certificate;
    this.certificatePassword = certificatePassword;
    this.debug = debug;
  }

  public async ConsultarNfsePorRps(input: TnsConsultarNfsePorRps) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);

    try {
      return await client.ConsultarNfsePorRpsAsync(input, {
        postProcess: (originalXML: string) => {
          return this.getSignedXml(
            originalXML,
            {
              location: {
                reference: `//*[local-name(.)='ConsultarNfseRpsEnvio']`,
                action: 'append',
              },
            },
            {
              xpath: `//*[local-name(.)='ConsultarNfseRpsEnvio']`,
              isEmptyUri: true,
            },
            pemCert,
          );
        },
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async ConsultarNfseServicoTomado(input: TnsConsultarNfseServicoTomado) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);

    try {
      return await client.ConsultarNfseServicoTomadoAsync(input, {
        postProcess: (originalXML: string) => {
          return this.getSignedXml(
            originalXML,
            {
              location: {
                reference: `//*[local-name(.)='ConsultarNfseServicoTomadoEnvio']`,
                action: 'append',
              },
            },
            {
              xpath: `//*[local-name(.)='ConsultarNfseServicoTomadoEnvio']`,
              isEmptyUri: true,
            },
            pemCert,
          );
        },
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async RecepcionarLoteRps(input: TnsRecepcionarLoteRps) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);

    try {
      return await client.RecepcionarLoteRpsAsync(input, {
        postProcess: (originalXML: string) => {
          return this.getSignedXml(
            originalXML,
            {
              location: {
                reference: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
                action: 'after',
              },
            },
            {
              xpath: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
            },
            pemCert,
          );
        },
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async RecepcionarLoteRpsSincrono(input: TnsRecepcionarLoteRpsSincrono) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);

    try {
      return await client.RecepcionarLoteRpsSincronoAsync(input, {
        postProcess: (originalXML: string) => {
          return this.getSignedXml(
            originalXML,
            {
              location: {
                reference: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
                action: 'after',
              },
            },
            {
              xpath: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
            },
            pemCert,
          );
        },
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async ConsultarNfseServicoPrestado(input: TnsConsultarNfseServicoPrestado) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);

    try {
      return await client.ConsultarNfseServicoPrestadoAsync(input, {
        postProcess: (originalXML: string) => {
          return this.getSignedXml(
            originalXML,
            {
              location: {
                reference: `//*[local-name(.)='ConsultarNfseServicoPrestadoEnvio']`,
                action: 'append',
              },
            },
            {
              xpath: `//*[local-name(.)='ConsultarNfseServicoPrestadoEnvio']`,
              isEmptyUri: true,
            },
            pemCert,
          );
        },
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async CancelarNfse(input: TnsCancelarNfse) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);
    try {
      return await client.CancelarNfseAsync(input, {
        postProcess: (xml: string) =>
          this.getSignedXml(
            xml,
            {
              location: {
                reference: `//*[local-name(.)='InfPedidoCancelamento']`,
                action: 'after',
              },
            },
            {
              xpath: `//*[local-name(.)='InfPedidoCancelamento']`,
            },
            pemCert,
          ),
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async ConsultarLoteRps(input: TnsConsultarLoteRps) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);
    try {
      return await client.ConsultarLoteRpsAsync(input, {
        postProcess: (xml: string) =>
          this.getSignedXml(
            xml,
            {
              location: {
                reference: `//*[local-name(.)='ConsultarLoteRpsEnvio']`,
                action: 'append',
              },
            },
            {
              xpath: `//*[local-name(.)='ConsultarLoteRpsEnvio']`,
              isEmptyUri: true,
            },
            pemCert,
          ),
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async ConsultarNfseFaixa(input: TnsConsultarNfseFaixa) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);
    try {
      return await client.ConsultarNfseFaixaAsync(input, {
        postProcess: (xml: string) =>
          this.getSignedXml(
            xml,
            {
              location: {
                reference: `//*[local-name(.)='ConsultarNfseFaixaEnvio']`,
                action: 'append',
              },
            },
            {
              xpath: `//*[local-name(.)='ConsultarNfseFaixaEnvio']`,
              isEmptyUri: true,
            },
            pemCert,
          ),
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async GerarNfse(input: TnsGerarNfse) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);
    try {
      return await client.GerarNfseAsync(input, {
        postProcess: (originalXML: string) => {
          return this.getSignedXml(
            originalXML,
            {
              location: {
                reference: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
                action: 'after',
              },
            },
            {
              xpath: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
            },
            pemCert,
          );
        },
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async SubstituirNfse(input: TnsSubstituirNfse) {
    const [client, pemCert] = await Promise.all([this.getSoapClient(), this.getPemCert()]);
    try {
      return await client.SubstituirNfseAsync(input, {
        postProcess: (originalXML: string) => {
          return this.getSignedXml(
            originalXML,
            {
              location: {
                reference: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
                action: 'after',
              },
            },
            {
              xpath: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
            },
            pemCert,
          );
        },
      });
    } catch (err) {
      throw err;
    } finally {
      this.logLastRequestResponse(client);
    }
  }

  public async ImprimirNfse(params: {
    cnpj: string;
    inscricaoMunicipal: string;
    numeroNfse: string;
    codigoVerificacao: string;
  }): Promise<Buffer> {
    try {
      const url = new URL(`${this.host}/servico/notafiscal/autenticacao/cpfCnpj/${params.cnpj}/inscricaoMunicipal/${params.inscricaoMunicipal}/numeroNota/${params.numeroNfse}/codigoVerificacao/${params.codigoVerificacao}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar NFSe: ${response.status} - ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        throw new Error(`Tipo de conteúdo inválido: ${contentType}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(`Falha ao imprimir NFSe: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  protected getSignedXml(
    xml: string,
    computeOptions: ComputeSignatureOptions,
    referenceOptions: ReferenceOptions,
    pemCert: Pkcs12Result,
  ) {
    const sig = new SignedXml({
      privateKey: pemCert.key,
      publicCert: pemCert.cert,
      implicitTransforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    });

    sig.addReference({
      ...this.defaultOptions,
      ...referenceOptions,
    });

    sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
    sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';

    /**
     * Aqui é necessário extrair somente o XML do conteúdo dentro do body para efetuar a assinatura
     * (por um motivo desconhecido). Mas funciona dessa forma!
     */
    const parser = new XMLParser({
      ignoreDeclaration: true,
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      numberParseOptions: {
        leadingZeros: false,
        hex: false,
        eNotation: false,
      },
    });

    const parsedXml = parser.parse(xml);
    const messageJsObject = parsedXml['soap:Envelope']['soap:Body'];

    const bodyXml = xmlbuilder.create(messageJsObject, { headless: true });
    const xmlConverted = bodyXml.end();

    sig.computeSignature(xmlConverted, computeOptions);
    const signedXml = sig.getSignedXml();

    /**
     * Após assinado, precisamos reconstruir o XML original inserindo a parte da assinatura
     * Os namespaces e atributos serão preservados
     */
    parsedXml['soap:Envelope']['soap:Body'] = '';
    const bodyEnvelope = xmlbuilder.create(parsedXml);

    const bodyEnvelopeString = bodyEnvelope.end({ pretty: false });
    return bodyEnvelopeString.replace('<soap:Body/>', `<soap:Body>${signedXml}</soap:Body>`);
  }

  private logLastRequestResponse(client: NotaFiscalSoapClient) {
    if (this.debug) {
      console.log(client.lastRequest);
      console.log(client.lastResponse);
    }
  }

  private async getPemCert(): Promise<Pkcs12Result> {
    return await readPkcs12FromBrowser(this.certificate, this.certificatePassword);
  }

  private async getSoapClient() {
    if (!this.soapClient) {
      this.soapClient = await createClientAsync(this.host);
    }
    return this.soapClient;
  }
}
