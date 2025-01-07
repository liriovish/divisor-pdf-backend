/**
 * Esse arquivo é responsável pelas validações e tratamentos antes de enviar
 * a consulta ou cadastro ao banco de dados
 *
 * NodeJS version 16.x
 *
 * @category  JavaScript
 * @package   Api Divisor de PDF
 * @author    Equipe Webcartórios <contato@webcartorios.com.br>
 * @copyright 2022 (c) DYNAMIC SYSTEM e Vish! Internet e Sistemas Ltda. - ME
 * @license   https://github.com/dynamic-system-vish/api-whatsapp/licence.txt BSD Licence
 * @link      https://github.com/dynamic-system-vish/api-whatsapp
 * @CriadoEm  14/11/2024
 */

/**
 * Configurações globais
 */
const HttpResponse = require('../../presentation/helpers/http-response')
const fs = require('fs')
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const AdmZip = require('adm-zip');

/**
 * Classe ApiUseCase
 * @package  src\domain\usecases
 */
module.exports = class ApiUseCase {
    /**
    * Função responsável por fazer upload de pdf      
    */
    async upload(oDados) {
        try {
            /**
             * Verifica e acessa o arquivo do objeto recebido
             * @var {object} oArquivo
             */
            const { oArquivo } = oDados;
    
            /**
             * Obt�m o buffer e o nome original do arquivo
             * @var {Buffer} buffer 
             * @var {string} originalname
             */
            const { buffer, originalname } = oArquivo;
    
            /**
             * Define o caminho de upload
             * @var {string} sCaminhoUpload 
             */
            const sCaminhoUpload = path.join(__dirname, '../../../uploads', `${originalname}`);
    
            /**
             * Salva o arquivo no sistema de arquivos
             */
            fs.writeFileSync(sCaminhoUpload, buffer);
    
            /**
             * Carrega o PDF e obtem o numero total de paginas
             * @var {PDFDocument} oDocumento 
             * @var {number} iTotalPages 
             */
            const oDocumento = await PDFDocument.load(buffer);
            const iTotalPages = oDocumento.getPageCount();
    
            /**
             * Faz a exclusao do arquivo apos 5 minutos
             */
            setTimeout(() => {
                fs.unlink(sCaminhoUpload, (err) => {
                    if (err) {
                        console.error(`Erro ao remover o arquivo: ${sCaminhoUpload}`, err);
                    } else {
                        console.log(`Arquivo removido de uploads: ${sCaminhoUpload}`);
                    }
                });
            }, 30 * 60 * 1000); 
    
            /**
             * Retorna a resposta de sucesso com os detalhes do PDF
             */
            return HttpResponse.ok({
                message: 'PDF carregado com sucesso.',
                originalname,
                iTotalPages
            });
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            return HttpResponse.badRequest({
                message: 'Não foi possível fazer upload.',
                error: error.message
            });
        }
    }
    
    /**
     * Função responsável por fazer divisão personalizada do PDF
     */
    async divisaoPersonalizada(oDados) {
        try {
             /**
             * Define o caminho de upload
             * @var {string} sCaminhoUpload 
             */
            const sCaminhoUpload = path.join(__dirname, '../../../uploads', `${oDados.originalname}.pdf`);
    
            
            if (!fs.existsSync(sCaminhoUpload)) {
                return HttpResponse.badRequest({ message: 'Arquivo não encontrado.' });
            }
            
            /**
             * Lê o arquivo PDF a partir do sistema de arquivos
             * @var {Buffer} pdfBytes
             */
            const pdfBytes = fs.readFileSync(sCaminhoUpload);
    
            /**
             * Carrega o documento PDF utilizando a biblioteca pdf-lib
             * @var {PDFDocument} oDocumento 
             */
            const oDocumento = await PDFDocument.load(pdfBytes);
            
            /**
             *  Obtém o total de páginas no arquivo PDF
             * @var {number} iTotalPaginas 
             */
            const iTotalPaginas = oDocumento.getPageCount();
    
            // Verifica se os parâmetros de página são válidos
            if (isNaN(oDados.paginaInicial) || isNaN(oDados.paginaFinal)) {
                return HttpResponse.badRequest({ message: 'Os valores de página devem ser números válidos.' });
            }

            // Gera um array de índices representando as páginas a serem copiadas
            const aIndices = Array.from(
                { length: oDados.paginaFinal - oDados.paginaInicial + 1 },
                (_, i) => (oDados.paginaInicial - 1) + i
            );
    
            // Verifica se algum índice está fora do intervalo válido de páginas
            if (aIndices.some(index => index < 0 || index >= iTotalPaginas)) {
                console.error('Erro: Índices fora do intervalo válido de páginas.');
                return HttpResponse.badRequest({ message: 'Intervalo de páginas inválido.' });
            }
    
            /**
             *  Cria um novo documento PDF para armazenar as páginas copiadas
             * @var {object} oNovoPdf
             */
            const oNovoPdf = await PDFDocument.create();
    
            /**
             * Copia as páginas do documento original para o novo documento
             * @var {array} aPaginas
             */
            const aPaginas = await oNovoPdf.copyPages(oDocumento, aIndices);
    
            aPaginas.forEach((pagina) => oNovoPdf.addPage(pagina));
    
            // Salva o novo documento PDF em formato binário
            const novoPdfBytes = await oNovoPdf.save();
    
             /**
             * Copia as páginas do documento original para o novo documento
             * @var {string} aPaginas
             */
            const sNovoArquivoNome = `${oDados.originalname}-${oDados.paginaInicial}-${oDados.paginaFinal}.pdf`;
    
            /**
             *  Define o caminho completo para salvar o novo arquivo PDF dividido
             * @var {string} sCaminhoNovoPdf
             */
            const sCaminhoNovoPdf = path.join(__dirname, '../../../downloads', sNovoArquivoNome);
    
            // Salva o novo arquivo PDF no sistema de arquivos
            fs.writeFileSync(sCaminhoNovoPdf, novoPdfBytes);
    
            // Retorna uma resposta de sucesso com o caminho de download do novo arquivo PDF
            return HttpResponse.ok({
                message: 'PDF dividido com sucesso.',
                arquivo: sNovoArquivoNome
            });
        } catch (error) {
            console.error('Erro ao dividir PDF:', error);
            return HttpResponse.badRequest({
                message: 'Erro ao dividir o PDF.',
                error: error.message,
            });
        }
    }
        
    /**
     * Função responsável por fazer divisão fixa do PDF em intervalos definidos
     */
    async divisaoFixa(oDados) {
        try {
            /**
             * Define o caminho do arquivo original na pasta de uploads
             * @var {string} sCaminhoUpload 
             */
            const sCaminhoUpload = path.join(__dirname, '../../../uploads', `${oDados.originalname}.pdf`);
    
            // Verifica se o arquivo original existe no sistema de arquivos
            if (!fs.existsSync(sCaminhoUpload)) {
                return HttpResponse.badRequest({ message: 'Arquivo não encontrado.' });
            }
    
            /**
             * Lê o conteúdo binário do arquivo PDF
             * @var {Buffer} pdfBytes 
             */
            const pdfBytes = fs.readFileSync(sCaminhoUpload);
    
            /**
             * Carrega o documento PDF utilizando a biblioteca pdf-lib
             * @var {PDFDocument} oDocumento 
             */
            const oDocumento = await PDFDocument.load(pdfBytes);
    
            /**
             * Obtém o número total de páginas do PDF
             * @var {number} iTotalPaginas 
             */
            const iTotalPaginas = oDocumento.getPageCount();
    
            // Valida se o intervalo de páginas é válido
            if (isNaN(oDados.intervalo) || oDados.intervalo < 1 || oDados.intervalo > iTotalPaginas) {
                return HttpResponse.badRequest({ message: 'Intervalo de páginas inválido.' });
            }
    
            /**
             * Calcula a quantidade de divisões necessárias com base no intervalo informado
             * @var {number} iDivisoes 
             */
            const iDivisoes = Math.ceil(iTotalPaginas / oDados.intervalo);
    
            /**
             * Array para armazenar os nomes dos arquivos PDF gerados
             * @var {Array<string>} aNomesArquivos 
             */
            const aNomesArquivos = [];
    
            // Loop para dividir o PDF em partes com base no intervalo
            for (let i = 0; i < iDivisoes; i++) {
                /**
                 * Cria um novo documento PDF para cada divisão
                 * @var {PDFDocument} oNovoPdf 
                 */
                const oNovoPdf = await PDFDocument.create();
    
                /**
                 * Determina o índice inicial e final das páginas para a divisão atual
                 * @var {number} iInicio
                 * @var {number} iFim
                 */
                const iInicio = i * oDados.intervalo;
                const iFim = Math.min((i + 1) * oDados.intervalo, iTotalPaginas);
    
                /**
                 * Gera os índices das páginas a serem copiadas para o novo documento
                 * @var {Array<number>} aIndices 
                 */
                const aIndices = Array.from({ length: iFim - iInicio }, (_, j) => iInicio + j);
    
                // Copia as páginas especificadas do documento original para o novo documento
                const aPaginas = await oNovoPdf.copyPages(oDocumento, aIndices);
                aPaginas.forEach((pagina) => oNovoPdf.addPage(pagina));
    
                /**
                 * Salva o novo documento PDF em formato binário
                 * @var {Buffer} novoPdfBytes 
                 */
                const novoPdfBytes = await oNovoPdf.save();
    
                /**
                 * Define o nome e o caminho do novo arquivo PDF gerado
                 * @var {string} sNovoPdfNome 
                 * @var {string} sCaminhoNovoPdf 
                 */
                const sNovoPdfNome = `${oDados.originalname}-${i + 1}.pdf`;
                const sCaminhoNovoPdf = path.join(__dirname, '../../../downloads', sNovoPdfNome);
    
                // Salva o novo arquivo PDF no sistema de arquivos
                fs.writeFileSync(sCaminhoNovoPdf, novoPdfBytes);
    
                // Adiciona o nome do arquivo gerado à lista
                aNomesArquivos.push(sNovoPdfNome);
            }
    
            /**
             * Cria um arquivo ZIP para armazenar os PDFs gerados
             * @var {string} sZipNome 
             * @var {string} sCaminhoZip 
             */
            const sZipNome = `${oDados.originalname}-dividido.zip`;
            const sCaminhoZip = path.join(__dirname, '../../../downloads', sZipNome);
            const oZip = new AdmZip();
    
            // Adiciona todos os PDFs gerados ao arquivo ZIP
            aNomesArquivos.forEach((nomeArquivo) => {
                const pdfPath = path.join(__dirname, '../../../downloads', nomeArquivo);
                oZip.addLocalFile(pdfPath);
            });
    
            // Salva o arquivo ZIP no sistema de arquivos
            oZip.writeZip(sCaminhoZip);
    
            // Remove os arquivos PDF individuais após criar o ZIP
            aNomesArquivos.forEach((nomeArquivo) => {
                const pdfPath = path.join(__dirname, '../../../downloads', nomeArquivo);
                fs.unlinkSync(pdfPath);
            });
    
            /**
             * Retorna o nome do arquivo ZIP gerado como resposta
             * @var {string} sArquivoFinal 
             */
            const sArquivoFinal = sZipNome;
    
            return HttpResponse.ok({
                message: 'PDF dividido com sucesso.',
                arquivo: sArquivoFinal,
            });
        } catch (error) {
            console.error('Erro ao dividir PDF:', error);
            return HttpResponse.badRequest({
                message: 'Erro ao dividir o PDF.',
                error: error.message,
            });
        }
    }
    

    /**
     * Função responsável por baixar o arquivo PDF
     */
    async baixarArquivo(oDados) {
        try {
            /**
             * Define o caminho completo do arquivo a ser baixado
             * @var {string} sCaminhoDownload
             */
            const sCaminhoDownload = path.join(__dirname, '../../../downloads', oDados.originalname);

            /**
             * Verifica se o arquivo existe no sistema de arquivos
             */
            if (!fs.existsSync(sCaminhoDownload)) {
                return HttpResponse.badRequest({ message: 'Arquivo não encontrado.' });
            }

            /**
             * Retorna o caminho do arquivo para download
             * @var {object} oResultado
             */
            const oResultado = { download: sCaminhoDownload };

            // Remove o arquivo da pasta após o download
            setTimeout(() => {
                fs.unlink(sCaminhoDownload, (err) => {
                    if (err) {
                        console.error(`Erro ao remover o arquivo: ${sCaminhoDownload}`, err);
                    } else {
                        console.log(`Arquivo removido de downloads: ${sCaminhoDownload}`);
                    }
                });
            }, 5000); 

            return oResultado;

        } catch (error) {
            console.error('Erro ao buscar arquivo para download:', error);
            return HttpResponse.badRequest({
                message: 'Erro ao buscar o arquivo.',
                error: error.message,
            });
        }
    }

}