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
const { v4: uuidv4 } = require('uuid')
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
    
            console.log('Arquivo recebido usecase:', oArquivo);
    
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
                        console.log(`Arquivo removido após 5 minutos: ${sCaminhoUpload}`);
                    }
                });
            }, 5 * 60 * 1000); 
    
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
             * Desestrutura os dados recebidos e obtém o nome original do arquivo paginaInicial e paginaFinal
             * @var {string} originalname 
             * @var {number} paginaInicial 
             * @var {number} paginaFinal 
             */
            const { originalname, paginaInicial, paginaFinal } = oDados;
    
             /**
             * Define o caminho de upload
             * @var {string} sCaminhoUpload 
             */
            const sCaminhoUpload = path.join(__dirname, '../../../uploads', `${originalname}.pdf`);
    
            
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
            if (isNaN(paginaInicial) || isNaN(paginaFinal)) {
                return HttpResponse.badRequest({ message: 'Os valores de página devem ser números válidos.' });
            }

            // Gera um array de índices representando as páginas a serem copiadas
            const aIndices = Array.from(
                { length: paginaFinal - paginaInicial + 1 },
                (_, i) => (paginaInicial - 1) + i
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
            const sNovoArquivoNome = `${originalname}-${paginaInicial}-${paginaFinal}.pdf`;
    
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
             * Desestrutura os dados recebidos e obtém o nome original do arquivo e o intervalo
             * @var {string} originalname
             * @var {number} intervalo
             */
            const { originalname, intervalo } = oDados;
    
            /**
             * Define o caminho do arquivo original a ser processado
             * @var {string} sCaminhoUpload
             */
            const sCaminhoUpload = path.join(__dirname, '../../../uploads', `${originalname}.pdf`);
    
            /**
             * Verifica se o arquivo existe no sistema de arquivos
             */
            if (!fs.existsSync(sCaminhoUpload)) {
                return HttpResponse.badRequest({ message: 'Arquivo não encontrado.' });
            }
    
            /**
             * Lê o arquivo PDF a partir do sistema de arquivos
             * @var {Buffer} pdfBytes
             */
            const pdfBytes = fs.readFileSync(sCaminhoUpload);
    
            /**
             * Verifica se o conteúdo do arquivo é válido
             */
            if (!pdfBytes || pdfBytes.length === 0) {
                return HttpResponse.badRequest({ message: 'Arquivo PDF inválido ou vazio.' });
            }
    
            /**
             * Carrega o documento PDF utilizando a biblioteca pdf-lib
             * @var {PDFDocument} oDocumento
             */
            const oDocumento = await PDFDocument.load(pdfBytes);
            
            /**
             * Obtém o total de páginas no arquivo PDF
             * @var {number} iTotalPaginas
             */
            const iTotalPaginas = oDocumento.getPageCount();
    
            /**
             * Verifica se o intervalo é válido
             * Se o intervalo não for válido, retorna erro 400
             */
            if (isNaN(intervalo) || intervalo < 1 || intervalo > iTotalPaginas) {
                return HttpResponse.badRequest({ message: 'Intervalo de páginas inválido.' });
            }
    
            /**
             * Calcula o número de partes que o PDF será dividido
             * @var {number} numDivisoes
             */
            const numDivisoes = Math.ceil(iTotalPaginas / intervalo);
            
            /**
             * Cria uma lista de nomes dos arquivos PDF gerados
             * @var {Array<string>} aNomesArquivos
             */
            const aNomesArquivos = [];
    
            /**
             * Divide o PDF em partes com o intervalo fixo e cria os arquivos PDF
             */
            for (let i = 0; i < numDivisoes; i++) {
                const oNovoPdf = await PDFDocument.create();
                const inicio = i * intervalo;
                const fim = Math.min((i + 1) * intervalo, iTotalPaginas);
    
                /**
                 * Cria os índices das páginas que serão copiadas para este novo arquivo
                 * @var {Array<number>} aIndices - Índices das páginas a serem copiadas
                 */
                const aIndices = Array.from({ length: fim - inicio }, (_, j) => inicio + j);
    
                /**
                 * Copia as páginas do documento original para o novo documento
                 */
                const aPaginas = await oNovoPdf.copyPages(oDocumento, aIndices);
                aPaginas.forEach((pagina) => oNovoPdf.addPage(pagina));
    
                /**
                 * Salva o novo arquivo PDF
                 * @var {Buffer} novoPdfBytes - Conteúdo binário do novo PDF
                 */
                const novoPdfBytes = await oNovoPdf.save();
                const novoPdfNome = `${originalname}-${i + 1}.pdf`;
                const sCaminhoNovoPdf = path.join(__dirname, '../../../downloads', novoPdfNome);
    
                /**
                 * Salva o novo arquivo no sistema de arquivos
                 */
                fs.writeFileSync(sCaminhoNovoPdf, novoPdfBytes);
    
                /**
                 * Adiciona o nome do arquivo gerado à lista
                 */
                aNomesArquivos.push(novoPdfNome);
            }
    
            /**
            * Define o arquivo final
            * @var {string} sArquivoFinal
            */
            let sArquivoFinal;
           
            /**
            * Caso o número de arquivos gerados seja maior que 2, cria um arquivo ZIP
            */
            if (aNomesArquivos.length > 2) {
                /**
                 * Cria um arquivo ZIP contendo todos os PDFs gerados
                 * @var {string} sZipNome 
                 * @var {string} sCaminhoZip 
                 */
                const sZipNome = `${originalname}-dividido.zip`;
                const sCaminhoZip = path.join(__dirname, '../../../downloads', sZipNome);
    
                /**
                 * Cria um arquivo temporário para armazenar o ZIP
                 * @var {object} oZip
                 */
                const oZip = new AdmZip();
    
                aNomesArquivos.forEach((nomeArquivo) => {
                    const pdfPath = path.join(__dirname, '../../../downloads', nomeArquivo);
                    oZip.addLocalFile(pdfPath);
                });
    
                /**
                 * Salva o arquivo ZIP no sistema de arquivos
                 */
                oZip.writeZip(sCaminhoZip);
    
                /**
                 * Deleta os PDFs gerados após criar o ZIP
                 */
                aNomesArquivos.forEach((nomeArquivo) => {
                    const pdfPath = path.join(__dirname, '../../../downloads', nomeArquivo);
                    fs.unlinkSync(pdfPath);  
                });
    
                /**
                 * Define o nome do arquivo ZIP como resposta final
                 */
                sArquivoFinal = sZipNome;
            } else {
                /**
                 * Caso haja 2 ou menos arquivos, retorna os nomes dos arquivos gerados
                 */
                sArquivoFinal = aNomesArquivos;
            }
    
            /**
             * Retorna a resposta de sucesso com o nome do arquivo (ou lista de nomes)
             */
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
            const { originalname } = oDados;

            /**
             * Define o caminho completo do arquivo a ser baixado
             * @var {string} sCaminhoDownload
             */
            const sCaminhoDownload = path.join(__dirname, '../../../downloads', originalname);

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

            // Remove o arquivo da pasta ap�s o download
            setTimeout(() => {
                fs.unlink(sCaminhoDownload, (err) => {
                    if (err) {
                        console.error(`Erro ao remover o arquivo: ${sCaminhoDownload}`, err);
                    } else {
                        console.log(`Arquivo removido: ${sCaminhoDownload}`);
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