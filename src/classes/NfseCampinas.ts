import { XMLParser } from 'fast-xml-parser';
import pem from 'pem';
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
import { ImprimirNfseRequest, ReferenceOptions } from '../types/nfseCampinas';

export class NfseCampinas {
  readonly defaultOptions: ReferenceOptions = {
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
    uri: 'rps@1',
  };
  private soapClient: NotaFiscalSoapClient;
  private readonly version = '2.2.1'; // Versão com correção de assinatura múltipla

  constructor(
    protected host: string,
    protected certificate: Buffer,
    protected certPassword: string,
    protected debug: boolean = false,
  ) {
    console.log(`[NFSe Campinas] Inicializando versão ${this.version}`);
    console.log(`[NFSe Campinas] Modo debug: ${debug}`);
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

  public async ImprimirNfse(param: ImprimirNfseRequest): Promise<Buffer> {
    try {
      // Constrói a URL com os parâmetros
      const url = new URL(
        `/notafiscal-ws/servico/notafiscal/autenticacao/cpfCnpj/${param.cnpj}/inscricaoMunicipal/${param.inscricaoMunicipal}/numeroNota/${param.numeroNfse}/codigoVerificacao/${param.codigoVerificacao}`,
        this.host,
      );

      // Faz a requisição GET
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf',
        },
      });

      // Verifica se a resposta foi bem sucedida
      if (!response.ok) {
        throw new Error(`Erro ao buscar NFSe: ${response.status} - ${response.statusText}`);
      }

      // Verifica se o content-type está correto
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        throw new Error(`Tipo de conteúdo inválido: ${contentType}`);
      }

      // Converte a resposta para Buffer
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      // Re-lança o erro com uma mensagem mais descritiva
      throw new Error(`Falha ao imprimir NFSe: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  protected getSignedXml(
    xml: string,
    computeOptions: ComputeSignatureOptions,
    referenceOptions: ReferenceOptions,
    pemCert: pem.Pkcs12ReadResult,
  ) {
    console.log(`[NFSe Campinas ${this.version}] Iniciando assinatura XML`);
    
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

    // Verifica se é uma lista de RPS
    const isListaRpsSincrono = messageJsObject['tns:RecepcionarLoteRpsSincrono']?.EnviarLoteRpsSincronoEnvio?.LoteRps?.ListaRps?.Rps;
    const isListaRps = messageJsObject['tns:RecepcionarLoteRps']?.EnviarLoteRpsEnvio?.LoteRps?.ListaRps?.Rps;

    if (isListaRpsSincrono || isListaRps) {
      console.log(`[NFSe Campinas ${this.version}] Detectada lista de RPS`);
      console.log(`[NFSe Campinas ${this.version}] Tipo de operação: ${isListaRpsSincrono ? 'RecepcionarLoteRpsSincrono' : 'RecepcionarLoteRps'}`);
      
      const rootNode = isListaRpsSincrono ? 'tns:RecepcionarLoteRpsSincrono' : 'tns:RecepcionarLoteRps';
      const envioNode = isListaRpsSincrono ? 'EnviarLoteRpsSincronoEnvio' : 'EnviarLoteRpsEnvio';
      const rpsList = messageJsObject[rootNode][envioNode].LoteRps.ListaRps.Rps;
      const rpsArray = Array.isArray(rpsList) ? rpsList : [rpsList];
      
      console.log(`[NFSe Campinas ${this.version}] Quantidade de RPS na lista: ${rpsArray.length}`);
      console.log(`[NFSe Campinas ${this.version}] Estrutura do XML original:`, {
        rootNode,
        envioNode,
        hasListaRps: !!messageJsObject[rootNode][envioNode].LoteRps.ListaRps,
        quantidadeRps: rpsArray.length
      });

      // Assina cada RPS individualmente
      rpsArray.forEach((rps, index) => {
        console.log(`[NFSe Campinas ${this.version}] Processando RPS ${index + 1}:`, {
          numero: rps.InfDeclaracaoPrestacaoServico.Rps.IdentificacaoRps.Numero,
          discriminacao: rps.InfDeclaracaoPrestacaoServico.Servico.Discriminacao,
          valor: rps.InfDeclaracaoPrestacaoServico.Servico.Valores.ValorServicos
        });
        
        // Cria uma nova instância de SignedXml para cada RPS
        const rpsSig = new SignedXml({
          privateKey: pemCert.key,
          publicCert: pemCert.cert,
          implicitTransforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
        });

        // Adiciona o ID ao InfDeclaracaoPrestacaoServico
        const id = `_${index}`;
        rps.InfDeclaracaoPrestacaoServico['@Id'] = id;
        console.log(`[NFSe Campinas ${this.version}] ID adicionado ao RPS ${index + 1}: ${id}`);

        rpsSig.addReference({
          ...this.defaultOptions,
          xpath: `//*[local-name(.)='InfDeclaracaoPrestacaoServico'][@Id='${id}']`,
          transforms: [
            'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
            'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
          ],
        });

        rpsSig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
        rpsSig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';

        // Cria um XML temporário apenas para assinar
        const tempXml = xmlbuilder.create({ InfDeclaracaoPrestacaoServico: rps.InfDeclaracaoPrestacaoServico }).end({ pretty: false });
        console.log(`[NFSe Campinas ${this.version}] XML temporário para assinatura do RPS ${index + 1}:`, tempXml);
        
        rpsSig.computeSignature(tempXml);
        const signedXml = rpsSig.getSignedXml();
        
        // Extrai apenas a assinatura do XML assinado
        const signedXmlObj = parser.parse(signedXml);
        rps.InfDeclaracaoPrestacaoServico.Signature = signedXmlObj.InfDeclaracaoPrestacaoServico.Signature;
        console.log(`[NFSe Campinas ${this.version}] Assinatura gerada para RPS ${index + 1}:`, {
          id,
          uri: rps.InfDeclaracaoPrestacaoServico.Signature.SignedInfo.Reference['@URI'],
          hasSignatureValue: !!rps.InfDeclaracaoPrestacaoServico.Signature.SignatureValue
        });
      });

      // Reconstruir o XML final mantendo a estrutura original
      const bodyXml = xmlbuilder.create(messageJsObject);
      const xmlConverted = bodyXml.end({ pretty: false });

      parsedXml['soap:Envelope']['soap:Body'] = parser.parse(xmlConverted);
      const bodyEnvelope = xmlbuilder.create(parsedXml);
      const bodyEnvelopeString = bodyEnvelope.end({ pretty: false });
      
      // Verifica se as assinaturas foram mantidas no XML final
      const finalXmlObj = parser.parse(bodyEnvelopeString);
      const finalRpsList = finalXmlObj['soap:Envelope']['soap:Body'][rootNode][envioNode].LoteRps.ListaRps.Rps;
      const finalRpsArray = Array.isArray(finalRpsList) ? finalRpsList : [finalRpsList];
      
      console.log(`[NFSe Campinas ${this.version}] Verificação do XML final:`, {
        quantidadeRps: finalRpsArray.length,
        rpsComAssinatura: finalRpsArray.filter(rps => rps.InfDeclaracaoPrestacaoServico.Signature).length,
        estrutura: {
          temEnvelope: !!finalXmlObj['soap:Envelope'],
          temBody: !!finalXmlObj['soap:Envelope']['soap:Body'],
          temRootNode: !!finalXmlObj['soap:Envelope']['soap:Body'][rootNode],
          temEnvioNode: !!finalXmlObj['soap:Envelope']['soap:Body'][rootNode][envioNode],
          temLoteRps: !!finalXmlObj['soap:Envelope']['soap:Body'][rootNode][envioNode].LoteRps,
          temListaRps: !!finalXmlObj['soap:Envelope']['soap:Body'][rootNode][envioNode].LoteRps.ListaRps
        }
      });
      
      console.log(`[NFSe Campinas ${this.version}] Assinatura XML concluída com sucesso`);
      return bodyEnvelopeString;
    } else {
      console.log(`[NFSe Campinas ${this.version}] Assinando XML único`);
      // Para outros casos, mantém o comportamento original
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

      const bodyXml = xmlbuilder.create(messageJsObject);
      const xmlConverted = bodyXml.end({ pretty: false });
      sig.computeSignature(xmlConverted, computeOptions);
      const signedXml = sig.getSignedXml();

      parsedXml['soap:Envelope']['soap:Body'] = parser.parse(signedXml);
      const bodyEnvelope = xmlbuilder.create(parsedXml);
      const bodyEnvelopeString = bodyEnvelope.end({ pretty: false });
      return bodyEnvelopeString;
    }
  }

  private logLastRequestResponse(client: NotaFiscalSoapClient) {
    if (this.debug) {
      console.log(client.lastRequest);
      console.log(client.lastResponse);
    }
  }

  private async getPemCert(): Promise<pem.Pkcs12ReadResult> {
    return await new Promise((resolve, reject) => {
      pem.readPkcs12(this.certificate, { p12Password: this.certPassword }, (err, cert) => {
        if (err) reject(err);
        else resolve(cert);
      });
    });
  }

  private async getSoapClient() {
    if (!this.soapClient) {
      this.soapClient = await createClientAsync(this.host);
    }
    return this.soapClient;
  }
}
