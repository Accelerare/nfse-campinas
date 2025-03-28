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
    jest.spyOn(require('xml-crypto'), 'SignedXml').mockImplementation((keyProvider) => {
      const instance = {
        computeSignature: jest.fn().mockImplementation((xml) => {
          instance.xmlToSign = xml;
        }),
        getSignedXml: jest.fn().mockImplementation(function() {
          if (this.xmlToSign.includes('InfDeclaracaoPrestacaoServico')) {
            const match = this.xmlToSign.match(/Id="_(\d+)"/);
            const id = match ? match[1] : '0';
            return this.xmlToSign.replace(
              '</InfDeclaracaoPrestacaoServico>',
              `</InfDeclaracaoPrestacaoServico><Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
                <SignedInfo>
                  <Reference URI="#_${id}"/>
                </SignedInfo>
                <SignatureValue>MOCK_SIGNATURE_VALUE</SignatureValue>
              </Signature>`
            );
          }
          return this.xmlToSign;
        }),
        addReference: jest.fn().mockImplementation((options) => {
          const match = options.xpath.match(/Id='_(\d+)'/);
          if (match) {
            instance.referenceUri = '#_' + match[1];
          }
        }),
        keyInfoProvider: keyProvider,
        canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
        xmlToSign: '',
        referenceUri: '',
      };

      mockSignedXmlInstances.push(instance);
      return instance;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve assinar corretamente um lote com múltiplos RPS', async () => {
    // Mock do certificado
    const mockPemCert = {
      key: 'mock-private-key',
      cert: 'mock-certificate',
      ca: ['mock-ca-certificate']
    };

    // Mock do método getPemCert
    jest.spyOn(nfse as any, 'getPemCert').mockResolvedValue(mockPemCert);

    // XML de exemplo com 2 RPS
    const xmlInput = `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <tns:RecepcionarLoteRpsSincrono>
          <EnviarLoteRpsSincronoEnvio>
            <LoteRps>
              <CpfCnpj>
                <Cnpj>19002553000101</Cnpj>
              </CpfCnpj>
              <InscricaoMunicipal>003782824</InscricaoMunicipal>
              <NumeroLote>25032422</NumeroLote>
              <ListaRps>
                <Rps>
                  <InfDeclaracaoPrestacaoServico Id="_0">
                    <Competencia>2025-03-24</Competencia>
                    <Prestador>
                      <CpfCnpj>
                        <Cnpj>19002553000101</Cnpj>
                      </CpfCnpj>
                      <InscricaoMunicipal>003782824</InscricaoMunicipal>
                    </Prestador>
                    <Servico>
                      <CodigoCnae>620310002</CodigoCnae>
                      <Discriminacao>teste 1</Discriminacao>
                      <Valores>
                        <ValorServicos>0</ValorServicos>
                        <ValorPis>0</ValorPis>
                        <ValorCofins>0</ValorCofins>
                        <ValorIr>0</ValorIr>
                        <ValorInss>0</ValorInss>
                        <ValorLiquidoNfse>0</ValorLiquidoNfse>
                        <OutrasRetencoes>0</OutrasRetencoes>
                        <DescontoIncondicionado>0</DescontoIncondicionado>
                        <Aliquota>2</Aliquota>
                        <ValorCsll>0</ValorCsll>
                        <BaseCalculo>0</BaseCalculo>
                        <IssRetido>0</IssRetido>
                        <ValorDeducoes>0</ValorDeducoes>
                        <ValorIss>0</ValorIss>
                        <DescontoCondicionado>0</DescontoCondicionado>
                      </Valores>
                      <IssRetido>0</IssRetido>
                      <ItemListaServico>01.05</ItemListaServico>
                      <CodigoMunicipio>3509502</CodigoMunicipio>
                      <ExigibilidadeISS>1</ExigibilidadeISS>
                      <MunicipioIncidencia>3509502</MunicipioIncidencia>
                    </Servico>
                    <Rps>
                      <Status>1</Status>
                      <DataEmissao>2025-03-24</DataEmissao>
                      <IdentificacaoRps>
                        <Numero>25032422</Numero>
                        <Tipo>1</Tipo>
                        <Serie>NF</Serie>
                      </IdentificacaoRps>
                    </Rps>
                    <Tomador>
                      <RazaoSocial>VECTOR SAUDE LTDA</RazaoSocial>
                      <Contato>
                        <Email>hmcheu@gmail.com</Email>
                      </Contato>
                      <IdentificacaoTomador>
                        <CpfCnpj>
                          <Cnpj>06227199001062</Cnpj>
                        </CpfCnpj>
                      </IdentificacaoTomador>
                      <Endereco>
                        <Numero>205</Numero>
                        <Uf>SP</Uf>
                        <CodigoMunicipio>3550308</CodigoMunicipio>
                        <Complemento/>
                        <Bairro/>
                        <Endereco>RUA ALBERTO DE SALVO</Endereco>
                        <Cep>13084759</Cep>
                      </Endereco>
                    </Tomador>
                    <OptanteSimplesNacional>2</OptanteSimplesNacional>
                    <IncentivoFiscal>2</IncentivoFiscal>
                  </InfDeclaracaoPrestacaoServico>
                </Rps>
                <Rps>
                  <InfDeclaracaoPrestacaoServico Id="_1">
                    <Competencia>2025-03-24</Competencia>
                    <Prestador>
                      <CpfCnpj>
                        <Cnpj>19002553000101</Cnpj>
                      </CpfCnpj>
                      <InscricaoMunicipal>003782824</InscricaoMunicipal>
                    </Prestador>
                    <Servico>
                      <CodigoCnae>620310002</CodigoCnae>
                      <Discriminacao>teste 2</Discriminacao>
                      <Valores>
                        <ValorServicos>0</ValorServicos>
                        <ValorPis>0</ValorPis>
                        <ValorCofins>0</ValorCofins>
                        <ValorIr>0</ValorIr>
                        <ValorInss>0</ValorInss>
                        <ValorLiquidoNfse>0</ValorLiquidoNfse>
                        <OutrasRetencoes>0</OutrasRetencoes>
                        <DescontoIncondicionado>0</DescontoIncondicionado>
                        <Aliquota>2</Aliquota>
                        <ValorCsll>0</ValorCsll>
                        <BaseCalculo>0</BaseCalculo>
                        <IssRetido>0</IssRetido>
                        <ValorDeducoes>0</ValorDeducoes>
                        <ValorIss>0</ValorIss>
                        <DescontoCondicionado>0</DescontoCondicionado>
                      </Valores>
                      <IssRetido>0</IssRetido>
                      <ItemListaServico>01.05</ItemListaServico>
                      <CodigoMunicipio>3509502</CodigoMunicipio>
                      <ExigibilidadeISS>1</ExigibilidadeISS>
                      <MunicipioIncidencia>3509502</MunicipioIncidencia>
                    </Servico>
                    <Rps>
                      <Status>1</Status>
                      <DataEmissao>2025-03-24</DataEmissao>
                      <IdentificacaoRps>
                        <Numero>25032423</Numero>
                        <Tipo>1</Tipo>
                        <Serie>NF</Serie>
                      </IdentificacaoRps>
                    </Rps>
                    <Tomador>
                      <RazaoSocial>SOCIEDADE CAMPINEIRA DE EDUCACAO E INSTRUCAO</RazaoSocial>
                      <Contato>
                        <Email>hmcheu@gmail.com</Email>
                      </Contato>
                      <IdentificacaoTomador>
                        <CpfCnpj>
                          <Cnpj>46020301000269</Cnpj>
                        </CpfCnpj>
                      </IdentificacaoTomador>
                      <Endereco>
                        <Numero>S/N</Numero>
                        <Uf>SP</Uf>
                        <CodigoMunicipio>3550308</CodigoMunicipio>
                        <Complemento/>
                        <Bairro>JARDIM LONDRES</Bairro>
                        <Endereco>AV JOHN BOYD DUNLOP</Endereco>
                        <Cep>13060803</Cep>
                      </Endereco>
                    </Tomador>
                    <OptanteSimplesNacional>2</OptanteSimplesNacional>
                    <IncentivoFiscal>2</IncentivoFiscal>
                  </InfDeclaracaoPrestacaoServico>
                </Rps>
              </ListaRps>
              <QuantidadeRps>2</QuantidadeRps>
            </LoteRps>
          </EnviarLoteRpsSincronoEnvio>
        </tns:RecepcionarLoteRpsSincrono>
      </soap:Body>
    </soap:Envelope>`;

    // Chama o método getSignedXml
    const signedXml = nfse['getSignedXml'](
      xmlInput,
      {
        location: {
          reference: "//*[local-name(.)='InfDeclaracaoPrestacaoServico']",
          action: "after"
        }
      },
      {
        xpath: "//*[local-name(.)='InfDeclaracaoPrestacaoServico']"
      },
      mockPemCert
    );

    // Filtra apenas as instâncias que foram usadas para assinar os RPS
    const rpsSigningInstances = mockSignedXmlInstances.filter(instance => 
      instance.xmlToSign.includes('InfDeclaracaoPrestacaoServico')
    );

    // Verifica se foram criadas exatamente 2 instâncias para assinar os RPS
    expect(rpsSigningInstances.length).toBe(2);

    // Verifica se o XML assinado contém os elementos corretos
    expect(signedXml).toContain('<soap:Envelope');
    expect(signedXml).toContain('<soap:Body');
    expect(signedXml).toContain('<tns:RecepcionarLoteRpsSincrono>');
    expect(signedXml).toContain('<EnviarLoteRpsSincronoEnvio>');
    expect(signedXml).toContain('<ListaRps>');
    expect(signedXml).toContain('<Rps>');

    // Verifica se cada RPS tem sua própria assinatura usando regex
    const rpsMatches = signedXml.match(/<Rps>[\s\S]*?<\/Rps>/g) || [];
    const signatureMatches = signedXml.match(/<Signature[\s\S]*?<\/Signature>/g) || [];
    
    expect(rpsMatches.length).toBe(2);
    expect(signatureMatches.length).toBe(2);

    // Verifica se cada RPS tem uma assinatura com a referência correta
    rpsSigningInstances.forEach((instance, index) => {
      const rpsXml = rpsMatches[index];
      const signatureXml = signatureMatches[index];
      
      expect(rpsXml).toContain(`Id="_${index}"`);
      expect(signatureXml).toContain(`URI="#_${index}"`);
    });

    // Verifica se computeSignature foi chamado uma vez para cada RPS
    rpsSigningInstances.forEach((instance) => {
      expect(instance.computeSignature).toHaveBeenCalledTimes(1);
    });
  });
}); 