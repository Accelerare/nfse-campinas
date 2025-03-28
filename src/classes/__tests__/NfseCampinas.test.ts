import { XMLParser } from 'fast-xml-parser';
import { NfseCampinas } from '../NfseCampinas';

describe('NfseCampinas - Assinatura de Múltiplos RPS', () => {
  let nfse: NfseCampinas;
  const mockHost = 'http://mock-host.com';
  const mockCert = Buffer.from('MOCK_CERTIFICATE');
  const mockPassword = '123456';
  let mockSignedXmlInstances: any[] = [];

  beforeEach(() => {
    nfse = new NfseCampinas(mockHost, mockCert, mockPassword, true);
    mockSignedXmlInstances = [];

    // Mock da classe SignedXml
    const mockSignedXml = function(this: any, keyProvider: any) {
      this.keyInfoProvider = keyProvider;
      this.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
      this.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
      this.xmlToSign = '';
      this.referenceUri = '';

      this.computeSignature = function(xml: string) {
        this.xmlToSign = xml;
      };

      this.getSignedXml = function() {
        if (this.xmlToSign.includes('InfDeclaracaoPrestacaoServico')) {
          const match = this.xmlToSign.match(/Id="_(\d+)"/);
          const id = match ? match[1] : '0';
          return this.xmlToSign.replace(
            '</InfDeclaracaoPrestacaoServico>',
            `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
              <SignedInfo>
                <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
                <Reference URI="#_${id}">
                  <Transforms>
                    <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
                    <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                  </Transforms>
                  <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
                  <DigestValue>MOCK_DIGEST_VALUE</DigestValue>
                </Reference>
              </SignedInfo>
              <SignatureValue>MOCK_SIGNATURE_VALUE</SignatureValue>
              <KeyInfo>
                <X509Data>
                  <X509Certificate>MOCK_CERTIFICATE</X509Certificate>
                </X509Data>
              </KeyInfo>
            </Signature></InfDeclaracaoPrestacaoServico>`
          );
        }
        return this.xmlToSign;
      };

      this.addReference = function(options: any) {
        const match = options.xpath.match(/Id='_(\d+)'/);
        if (match) {
          this.referenceUri = '#_' + match[1];
        }
      };

      mockSignedXmlInstances.push(this);
    };

    jest.spyOn(require('xml-crypto'), 'SignedXml').mockImplementation(mockSignedXml);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve assinar corretamente um lote com múltiplos RPS', async () => {
    const mockPemCert = {
      key: 'mock-key',
      cert: 'mock-cert',
      ca: ['mock-ca-certificate']
    };

    // @ts-ignore - Acessando método protegido para teste
    const signedXml = nfse.getSignedXml(
      '<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://nfse.abrasf.org.br"><soap:Body><tns:RecepcionarLoteRps><EnviarLoteRpsEnvio><LoteRps><CpfCnpj><Cnpj>12345678000199</Cnpj></CpfCnpj><InscricaoMunicipal>123456</InscricaoMunicipal><NumeroLote>1</NumeroLote><ListaRps><Rps><InfDeclaracaoPrestacaoServico><Competencia>2025-03-24</Competencia><Prestador><CpfCnpj><Cnpj>12345678000199</Cnpj></CpfCnpj><InscricaoMunicipal>123456</InscricaoMunicipal></Prestador><Servico><CodigoCnae>620310002</CodigoCnae><Discriminacao>teste 1</Discriminacao><Valores><ValorServicos>100</ValorServicos><ValorIss>2</ValorIss></Valores></Servico><Rps><Status>1</Status><DataEmissao>2025-03-24</DataEmissao><IdentificacaoRps><Numero>1</Numero><Serie>NF</Serie><Tipo>1</Tipo></IdentificacaoRps></Rps><Tomador><RazaoSocial>Teste 1</RazaoSocial><IdentificacaoTomador><CpfCnpj><Cnpj>98765432000199</Cnpj></CpfCnpj></IdentificacaoTomador></Tomador></InfDeclaracaoPrestacaoServico></Rps><Rps><InfDeclaracaoPrestacaoServico><Competencia>2025-03-24</Competencia><Prestador><CpfCnpj><Cnpj>12345678000199</Cnpj></CpfCnpj><InscricaoMunicipal>123456</InscricaoMunicipal></Prestador><Servico><CodigoCnae>620310002</CodigoCnae><Discriminacao>teste 2</Discriminacao><Valores><ValorServicos>200</ValorServicos><ValorIss>4</ValorIss></Valores></Servico><Rps><Status>1</Status><DataEmissao>2025-03-24</DataEmissao><IdentificacaoRps><Numero>2</Numero><Serie>NF</Serie><Tipo>1</Tipo></IdentificacaoRps></Rps><Tomador><RazaoSocial>Teste 2</RazaoSocial><IdentificacaoTomador><CpfCnpj><Cnpj>98765432000199</Cnpj></CpfCnpj></IdentificacaoTomador></Tomador></InfDeclaracaoPrestacaoServico></Rps></ListaRps><QuantidadeRps>2</QuantidadeRps></LoteRps></EnviarLoteRpsEnvio></tns:RecepcionarLoteRps></soap:Body></soap:Envelope>',
      {
        location: {
          reference: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
          action: 'after',
        },
      },
      {
        xpath: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
      },
      mockPemCert,
    );

    // Verifica se o XML final mantém a estrutura correta
    expect(signedXml).toContain('<soap:Envelope');
    expect(signedXml).toContain('<soap:Body>');
    expect(signedXml).toContain('<tns:RecepcionarLoteRps>');
    expect(signedXml).toContain('<EnviarLoteRpsEnvio>');
    expect(signedXml).toContain('<LoteRps>');
    expect(signedXml).toContain('<ListaRps>');

    // Verifica se cada RPS tem sua própria assinatura usando regex
    const rpsMatches = signedXml.match(/<Rps>[\s\S]*?<\/Rps>/g) || [];
    const signatureMatches = signedXml.match(/<Signature[\s\S]*?<\/Signature>/g) || [];
    const idMatches = signedXml.match(/Id="_[0-9]"/g) || [];
    
    expect(rpsMatches.length).toBe(2);
    expect(signatureMatches.length).toBe(2);
    expect(idMatches.length).toBe(2);

    // Verifica se cada RPS tem uma assinatura com a referência correta
    rpsMatches.forEach((rpsXml, index) => {
      expect(rpsXml).toContain(`Id="_${index}"`);
      expect(signatureMatches[index]).toContain(`URI="#_${index}"`);
    });

    // Verifica se computeSignature foi chamado uma vez para cada RPS
    expect(mockSignedXmlInstances.length).toBe(2);
    mockSignedXmlInstances.forEach((instance) => {
      expect(instance.xmlToSign).toContain('InfDeclaracaoPrestacaoServico');
    });

    // Verifica se os IDs foram adicionados corretamente
    const parser = new XMLParser({
      ignoreDeclaration: true,
      ignoreAttributes: false,
      attributeNamePrefix: '@',
    });
    const parsedXml = parser.parse(signedXml);
    const rpsList = parsedXml['soap:Envelope']['soap:Body']['tns:RecepcionarLoteRps'].EnviarLoteRpsEnvio.LoteRps.ListaRps.Rps;
    
    rpsList.forEach((rps: any, index: number) => {
      expect(rps.InfDeclaracaoPrestacaoServico['@Id']).toBe(`_${index}`);
      expect(rps.InfDeclaracaoPrestacaoServico.Signature).toBeDefined();
      expect(rps.InfDeclaracaoPrestacaoServico.Signature.SignedInfo.Reference['@URI']).toBe(`#_${index}`);
    });
  });
}); 