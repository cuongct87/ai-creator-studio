(()=>{'use strict';
const $=id=>document.getElementById(id);
const dict={
vi:['🧩 Mẫu công việc & Kho prompt — v1.5','Mẫu hỗ trợ in ấn, quảng cáo và sáng tạo nội dung. Dùng với Free, Gemini và các AI khác.','Chọn mẫu','Thêm mẫu vào ý tưởng','Mẫu được thêm vào ô Ý tưởng, không xóa nội dung cũ. Hãy thay thông tin trong [ngoặc vuông].','Lưu ý tưởng / kết quả','Tải TXT','Kho prompt trên thiết bị','Mở bản đã lưu','Xóa mục đã chọn','Xóa tất cả bản lưu','Chỉ lưu khi bấm "Lưu". Dữ liệu nằm trên thiết bị, không đồng bộ đám mây. Không lưu API key.','— Chọn một mẫu —','— Chưa có bản lưu —'],
en:['🧩 Work Templates & Prompt Vault — v1.5','Ready-made templates for printing, advertising and content creation. Works with Free, Gemini and other AI providers.','Choose template','Add template to idea','Adds the template to your idea without deleting existing text. Replace the [bracketed] details.','Save idea / result','Export TXT','Saved prompts on this device','Load saved item','Delete selected item','Delete all saved items','Saved only when you press Save. Data stays on this device and is not cloud-synced. API keys are never saved.','— Choose a template —','— No saved items —'],
'zh-CN':['🧩 工作模板与提示词库 — v1.5','适用于印刷、广告和内容创作的模板。支持免费模式、Gemini 和其他 AI 服务。','选择模板','将模板添加到创意','模板将添加到创意中，不会删除现有内容。请替换[方括号]中的信息。','保存创意 / 结果','导出 TXT','设备上的提示词库','打开已保存项目','删除所选项目','删除全部记录','仅在点击"保存"时保存。数据保留在本机，不会同步到云端，也不会保存 API 密钥。','— 选择模板 —','— 暂无记录 —'],
ko:['🧩 작업 템플릿 & 프롬프트 보관함 — v1.5','인쇄, 광고 및 콘텐츠 제작용 템플릿입니다. Free, Gemini 및 다른 AI 서비스와 함께 사용하세요.','템플릿 선택','아이디어에 템플릿 추가','기존 텍스트를 삭제하지 않고 템플릿을 아이디어에 추가합니다. [괄호] 안의 내용을 실제 정보로 교체하세요.','아이디어 / 결과 저장','TXT 내보내기','이 기기의 저장된 프롬프트','저장 항목 불러오기','선택 항목 삭제','저장 항목 모두 삭제','저장 버튼을 눌렀을 때만 저장됩니다. 데이터는 이 기기에만 저장되며 클라우드에 동기화되지 않습니다. API 키는 저장되지 않습니다.','— 템플릿을 선택하세요 —','— 저장된 항목 없음 —'],
es:['🧩 Plantillas de trabajo & Biblioteca de prompts — v1.5','Plantillas listas para impresión, publicidad y creación de contenido. Compatible con Free, Gemini y otros proveedores de IA.','Elegir plantilla','Agregar plantilla a la idea','Agrega la plantilla a tu idea sin borrar el texto existente. Reemplaza los [corchetes] con tu información real.','Guardar idea / resultado','Exportar TXT','Prompts guardados en este dispositivo','Cargar elemento guardado','Eliminar elemento seleccionado','Eliminar todos los guardados','Solo se guarda al presionar Guardar. Los datos permanecen en este dispositivo y no se sincronizan en la nube. Las claves API nunca se guardan.','— Elige una plantilla —','— No hay elementos guardados —'],
ja:['🧩 作業テンプレート & プロンプトライブラリ — v1.5','印刷、広告、コンテンツ制作向けのテンプレートです。Free、Gemini、その他の AI サービスで使用できます。','テンプレートを選択','テンプレートをアイデアに追加','既存のテキストを削除せずにテンプレートをアイデアに追加します。[括弧]内の内容を実際の情報に置き換えてください。','アイデア / 結果を保存','TXT に書き出す','このデバイスの保存済みプロンプト','保存した項目を読み込む','選択した項目を削除','保存済み項目をすべて削除','「保存」を押したときのみ保存されます。データはこのデバイスに保存され、クラウドには同期されません。API キーは保存されません。','— テンプレートを選択 —','— 保存済み項目なし —'],
th:['🧩 เทมเพลตงาน & คลังพรอมต์ — v1.5','เทมเพลตสำเร็จรูปสำหรับงานพิมพ์ โฆษณา และการสร้างเนื้อหา ใช้ได้กับ Free, Gemini และ AI อื่นๆ','เลือกเทมเพลต','เพิ่มเทมเพลตลงในแนวคิด','เพิ่มเทมเพลตลงในแนวคิดโดยไม่ลบข้อความเดิม แทนที่รายละเอียดใน [วงเล็บ] ด้วยข้อมูลจริง','บันทึกแนวคิด / ผลลัพธ์','ส่งออก TXT','พรอมต์ที่บันทึกในอุปกรณ์นี้','โหลดรายการที่บันทึก','ลบรายการที่เลือก','ลบรายการที่บันทึกทั้งหมด','บันทึกเฉพาะเมื่อกดปุ่มบันทึก ข้อมูลอยู่ในอุปกรณ์นี้เท่านั้น ไม่ซิงค์กับคลาวด์ ไม่บันทึก API key','— เลือกเทมเพลต —','— ยังไม่มีรายการที่บันทึก —'],
id:['🧩 Templat Kerja & Lemari Prompt — v1.5','Templat siap pakai untuk percetakan, periklanan, dan pembuatan konten. Kompatibel dengan Free, Gemini, dan penyedia AI lainnya.','Pilih templat','Tambahkan templat ke ide','Menambahkan templat ke ide tanpa menghapus teks yang ada. Ganti detail dalam [tanda kurung] dengan informasi nyata.','Simpan ide / hasil','Ekspor TXT','Prompt tersimpan di perangkat ini','Muat item tersimpan','Hapus item yang dipilih','Hapus semua item tersimpan','Hanya disimpan saat menekan Simpan. Data tetap di perangkat ini dan tidak disinkronkan ke cloud. Kunci API tidak pernah disimpan.','— Pilih templat —','— Tidak ada item tersimpan —'],
fr:['🧩 Modèles de travail & Bibliothèque de prompts — v1.5','Modèles prêts à utiliser pour impression, publicité et création de contenu. Compatible avec Free, Gemini et autres services IA.','Choisir un modèle','Ajouter le modèle à idée','Ajoute le modèle à votre idée sans supprimer le texte existant. Remplacez les [crochets] par vos informations.','Enregistrer idée / résultat','Exporter en TXT','Prompts enregistrés sur cet appareil','Charger élément enregistré','Supprimer élément sélectionné','Supprimer tous les enregistrements','Enregistré uniquement en cliquant sur Enregistrer. Les données restent sur cet appareil, non synchronisées. Clés API jamais sauvegardées.','— Choisir un modèle —','— Aucun élément enregistré —'],
'pt-BR':['🧩 Modelos de Trabalho & Cofre de Prompts — v1.5','Modelos prontos para impressão, publicidade e criação de conteúdo. Compatível com Free, Gemini e outros provedores de IA.','Escolher modelo','Adicionar modelo à ideia','Adiciona o modelo à sua ideia sem apagar o texto existente. Substitua os detalhes em [colchetes] pelas suas informações reais.','Salvar ideia / resultado','Exportar TXT','Prompts salvos neste dispositivo','Carregar item salvo','Excluir item selecionado','Excluir todos os salvos','Salvo somente ao pressionar Salvar. Os dados ficam neste dispositivo e não são sincronizados na nuvem. Chaves de API nunca são salvas.','— Escolha um modelo —','— Nenhum item salvo —']
};
const presets={
vi:['Biển quảng cáo / Bảng hiệu','Thiệp / Phông cưới','Cáo phó / Thông báo tang lễ','Ảnh quảng cáo sản phẩm','Bài đăng mạng xã hội','Storyboard video quảng cáo','Ảnh chân dung phục chế'],
en:['Advertising signs / Signage','Wedding invitations / Backdrops','Obituary / Funeral notice','Product advertising image','Social media post','Advertising video storyboard','Portrait photo restoration'],
'zh-CN':['广告牌 / 招牌','婚礼请柬 / 背景板','讣告 / 葬礼通知','产品广告图片','社交媒体帖子','广告视频分镜','人像照片修复'],
ko:['광고판 / 간판','청첩장 / 웨딩 배경','부고 / 장례 안내','제품 광고 이미지','소셜 미디어 게시물','광고 영상 스토리보드','인물 사진 복원'],
es:['Letreros publicitarios / Cartelería','Invitaciones de boda / Fondos','Esquela / Aviso fúnebre','Imagen publicitaria de producto','Publicación en redes sociales','Guion gráfico de video publicitario','Restauración de retrato fotográfico'],
ja:['広告看板 / 屋外サイン','ウェディング招待状 / 背景','訃報 / 葬儀案内','商品広告画像','ソーシャルメディア投稿','広告動画絵コンテ','ポートレート写真の復元'],
th:['ป้ายโฆษณา / ป้ายร้านค้า','การ์ดแต่งงาน / ฉากหลัง','ประกาศมรณกรรม / แจ้งงานศพ','ภาพโฆษณาสินค้า','โพสต์โซเชียลมีเดีย','สตอรี่บอร์ดวิดีโอโฆษณา','การบูรณะภาพถ่ายบุคคล'],
id:['Papan iklan / Signage','Undangan pernikahan / Latar belakang','Berita duka / Pengumuman pemakaman','Gambar iklan produk','Postingan media sosial','Storyboard video iklan','Restorasi foto potret'],
fr:['Panneaux publicitaires / Affichage','Invitations de mariage / Arrière-plans','Avis de décès / Avis funèbre','Image publicitaire de produit','Publication sur les réseaux sociaux','Storyboard de vidéo publicitaire','Restauration de portrait photographique'],
'pt-BR':['Placas publicitárias / Sinalização','Convites de casamento / Painéis de fundo','Obituário / Aviso fúnebre','Imagem publicitária de produto','Publicação em redes sociais','Storyboard de vídeo publicitário','Restauração de foto de retrato']
};
const savedItemLabel={
vi:'— Chọn bản lưu —',
en:'— Select saved item —',
'zh-CN':'— 选择已保存项目 —',
ko:'— 저장 항목 선택 —',
es:'— Seleccionar elemento guardado —',
ja:'— 保存した項目を選択 —',
th:'— เลือกรายการที่บันทึก —',
id:'— Pilih item tersimpan —',
fr:'— Sélectionner un élément enregistré —',
'pt-BR':'— Selecionar item salvo —'
};
const ids=['v15Apply','v15Save','v15Export','v15Load','v15Delete','v15Clear'];
const labelText=(id,value)=>{let n=$(id);if(!n)return;let lab=n.closest('label');if(!lab)return;for(let child of lab.childNodes){if(child.nodeType===3&&child.textContent.trim()){child.textContent=value+' ';return}}};
function translate(){
  const box=$('v15Workspace'),lang=$('language');
  if(!box||!lang)return;
  const code=dict[lang.value]?lang.value:'en',d=dict[code];
  const h=box.querySelector('h3');if(h)h.textContent=d[0];
  const contentNotes=Array.from(box.querySelectorAll('p.v15-note:not(#v15Status)'));
  if(contentNotes[0])contentNotes[0].textContent=d[1];
  if(contentNotes[1])contentNotes[1].textContent=d[4];
  const privacyNote=contentNotes[contentNotes.length-1];
  if(privacyNote&&contentNotes.length>=3)privacyNote.textContent=d[11];
  labelText('v15Preset',d[2]);labelText('v15History',d[7]);
  [3,5,6,8,9,10].forEach((k,i)=>{const n=$(ids[i]);if(n)n.textContent=d[k];});
  const select=$('v15Preset');
  if(select){
    if(select.options[0])select.options[0].textContent=d[12];
    const names=presets[code]||presets.en;
    names.forEach((name,i)=>{if(select.options[i+1])select.options[i+1].textContent=name;});
  }
  const history=$('v15History');
  if(history&&history.options[0]&&!history.options[0].value){
    history.options[0].textContent=history.options.length>1?(savedItemLabel[code]||savedItemLabel.en):d[13];
  }
}
function init(){translate();$('language')?.addEventListener('change',()=>queueMicrotask(translate));const box=$('v15Workspace');if(box)box.addEventListener('click',()=>setTimeout(translate,0));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
