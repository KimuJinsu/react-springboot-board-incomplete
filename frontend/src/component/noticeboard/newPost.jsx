import { useEffect, useState , useRef , Fragment } from "react";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Link } from "react-router-dom";
// import axios from "axios";
import axios from "../../utils/axiosConfig";
import Postlabel from "./postlabel";

const NewPost = ({ idStatus }) => {
  const [postContent , setPostContent] = useState({
    title : '' ,  //제목
    content : '' // 내용
  });

  const [postOption , setPostOption] = useState({
    blockComm : false ,
    privates : false
  });
  const [showFileList , setShowFileList] = useState([]); // 파일 리스트
  const [deletedFileList , setDeletedFileList] = useState([]); // 삭제된 파일 리스트
  const imageInput = useRef();

  const [labelAddMode , setLabelMode] = useState(false); // 라벨 작성 모드
  const [labelData , setLabelData] = useState([]); // 라벨 리스트
  const labelInputData = useRef(''); // 라벨입력 값

  const deleteFile = (e) => { // 삭제된 파일 정보를 반환
    const result = showFileList.filter(item => item !== e );
    setDeletedFileList(prevList => [...prevList , e[0].id]);
    setShowFileList(result);
  }

  const ShowFileList = ({data , delitem}) => { // 첨부파일 정보
    return(
      data.map(item => (
        <Fragment key={item[0].name}>
          <span className="postattachments">{item[0].name}</span>
          <svg onClick={() => delitem(item)} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-square postattachmentdelete" viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </Fragment>
      ))
    )
  }

  const uploadFile = (e) => {
    let inputCheck = true;
    if(showFileList.length >= 5) {
      alert("첨부파일은 최대 5개까지 첨부할 수 있습니다.");
    } else {
      showFileList.every(item => { 
        if (item[0].name === e.target.files[0].name) {
          alert("해당 파일은 이미 존재합니다.");
          inputCheck = false;
          return false;
        } else if (e.target.files[0].size > 10 * 1024 * 1024) {
          alert("10M가 넘는 파일은 제외되었습니다.");
          inputCheck = false;
          return false;
        } else if (e.target.files[0].name.length > 30) {
          alert("파일명이 30자가 넘는 파일은 제외되었습니다.");
          inputCheck = false;
          return false;
        } else if (e.target.files[0].name.split('.')[1] === undefined || e.target.files[0].name.split('.')[1] === 'exe' || e.target.files[0].name.split('.')[1] === 'bat') {
          alert("비 정상적인 파일은 제외되었습니다.");
          inputCheck = false;
          return false;
        }
      });
    }
    if(inputCheck) {
      setShowFileList([...showFileList , e.target.files]);
    }
  }

  const addLabel = (e) => {
    if(e.key === 'Enter') {
      if(labelData.length >= 5) {
        alert("최대 라벨은 5개까지 생성할 수 있습니다.");
        setLabelMode(false);
      }
      else if(labelData.includes(labelInputData.current.value)) {
        alert("이미 동일한 라벨이 존재합니다.");
        setLabelMode(false);
      } 
      else if(labelInputData.current.value === "") { // 라벨이 빈값일 때
        setLabelMode(false);
      }
      else {
        setLabelData([...labelData , labelInputData.current.value]); // 라벨 추가
        setLabelMode(false);
      }
    }
  }

  const delLabel = (labelContent) => {
    setLabelData(labelData.filter(item => item !== labelContent));
  }

  useEffect(async () => {
    checkModifiedOrNewpost();
    if (idStatus == undefined) {
      alert('로그인 후 사용해주세요.');
      window.history.back();
    }
  }, []);

  const checkModifiedOrNewpost = async () => {
    const urlStat = window.location.pathname;
    const urlResult = urlStat.split("/");
  
    if (urlResult[1] === 'modified') { // 게시글 수정일 때
      try {
        const serverResult = await axios({
          url: `/posts/${parseInt(urlResult[2])}`,
          method: "GET",
        });
  
        const postData = serverResult.data;
  
        // 사용자 검증
        if (idStatus !== postData.writerUsername) {
          alert('비정상적인 접근입니다.');
          window.location.href = '/noticelist';
          return;
        }
  
        // 첨부파일 설정 (배열을 확인 후 필터링)
        const attachResult = (postData.attachments || []).map(item => ({
          name: item.realFileName,
          id: item.attachmentId,
        }));
  
        setShowFileList(attachResult);
  
        // 게시글 제목과 내용 설정
        setPostContent({
          title: postData.title || "",       // 빈 값 방지
          content: postData.content || ""    // 빈 값 방지
        });
  
        // 옵션 설정
        setPostOption({
          blockComm: postData.blockComment || false,
          privates: postData.privatePost || false,
        });
  
        // 태그 설정
        setLabelData(postData.tags || []);
  
      } catch (e) {
        console.error("게시글 수정 데이터 불러오기 실패:", e);
        window.location.href = `/viewpost?page=${urlResult[2]}`;
      }
    }
  };
  
  

  // const checkModifiedOrNewpost = async () => {
  //   const urlStat = window.location.pathname;
  //   const urlResult = urlStat.split("/");
  //   if (urlResult[1] === 'modified') {    // 포스트 수정일 때 데이터를 가져옵니다.
  //     const serverResult = await axios({
  //         url : `/posts/${parseInt(urlResult[2])}` ,
  //         mode : "cors" ,
  //         method : "GET"
  //     })
  //     .catch((e) => { window.location.href = `/viewpost?page=${urlResult[2]}`});
      
  //     if (idStatus !== serverResult.data.data.writer) { // url를 통해 불법적 접근은 제어
  //       alert('비정상적인 접근입니다.');
  //       window.location.href = '/noticelist';
  //     } else {
  //       const getTags = serverResult.data.data.tags;
  //       const getAttachMent = serverResult.data.data.attachment;

  //       if(getAttachMent !== null) {
  //         const attachResult = getAttachMent.map(item => { return [{
  //           name : item.realFileName, id : item.attachmentId
  //          }]});
   
  //          setShowFileList(attachResult);
  //       }
        
  //       setPostContent({...postContent , title : serverResult.data.data.title});
  //       setPostContent({...postContent , content : serverResult.data.data.content});
  //       setPostOption({...postOption , blockComm: serverResult.data.data.blockComment , privates: serverResult.data.data.private});
  //       setLabelData(getTags);
  //     }
  //   }
  // }

  const newPost = async () => { // 새로운 글 작성 모드
    const urlStat = window.location.pathname;
    const urlResult = urlStat.split("/");

    // 입력값이 없을 때
    if(postContent.title === '') {
      alert("제목을 입력해주세요.");
      return;
    }
    if(postContent.content === '') {
      alert("내용을 입력해주세요.");
      return;
    }

    if (urlResult[1] === 'newpost') { // 새글 등록일때
      if (postContent.content.length > 1000) {
        alert("내용이 1000자를 초과했습니다.");
        return -1;
      }

      const jsonPostData = {"title" : postContent.title , "content" : postContent.content , "privatePost" : postOption.privates , 
      "blockComment" : postOption.blockComm , "tags" : labelData , "deletedFileIds" : []};

      let requestForm = new FormData();
      const blob = new Blob([JSON.stringify(jsonPostData)], { type: "application/json" });
      requestForm.append("postRequest" , blob);
      showFileList.map(item => {
        requestForm.append('multipartFiles', item[0]);
      });

      await axios({
          method : "POST" ,
              mode: "cors" , 
              url : `/posts`,
              headers : {'Content-Type': 'multipart/form-data'} ,
              data : requestForm
      })
      .then((response) => {
        if(response.data.data == "4") {
          newPost();
          return;
        }
        window.location.replace('/noticelist'); }) 
      .catch((e) => alert(e.response.data.message));
      
    } else if (urlResult[1] === 'modified') { // 포스트 수정

      const jsonPostData = {"title" : postContent.title , "content" : postContent.content , "privatePost" : postOption.privates , 
      "blockComment" : postOption.blockComm , "tags" : labelData , "deletedFileIds" : deletedFileList};

      let requestForm = new FormData();
      const blob = new Blob([JSON.stringify(jsonPostData)], { type: "application/json" });
      requestForm.append("postRequest" , blob);
      showFileList.map(item => {
        requestForm.append('multipartFiles', item[0]);
      });
      
      await axios({
        method : "PUT" ,
        url : `/posts/${urlResult[2]}`,
        data : requestForm ,
        headers: {}
      })
      .then((response) => { 
        if(response.data.data == "4") {
          newPost();
          return;
        }
        window.location.replace('/noticelist'); }) 
      .catch((e) => alert(e.response.data.message));
    }
  }
  

  const onChangeContent = (e) => {
    const { name , value } = e.target;
    setPostContent({...postContent , [name] : value });
  }

  const onChangeOption = (e) => {
    const {name , checked } = e.target;
    setPostOption({...postOption , [name] : checked});
  }

  return (
    <section className="newPostArea">
      <div className='formwrapper'>
        <CKEditor className="editor"
          editor={ClassicEditor}
          data={postContent.content} // 기본값 속성
          onReady={editor => {
          }}
          onChange={(event, editor) => {
            setPostContent({...postContent , content : editor.getData()});
          }}
          onBlur={(event, editor) => {
          }}
          onFocus={(event, editor) => {
          }}
        />
      <span style={{position:"relative" , top:"-25px" , left:"-5px" , float:"right"}}>{postContent.content.length} / 1000</span>
      </div>
      <div className="postController">
        <Link to={"/noticelist"} className="linkButtondesign"><button className="postviewbutton_cancel">Cancel</button></Link>
        <Link to={`/newpost`} className="linkButtondesign" onClick={newPost}><button className="postviewbutton">Update</button></Link>
        <div className="centerLine"/>
        <div className="postSettings">
        <span className="publicinSection">Public in Section</span>
          <label className="postsettingcontent">
            <input type="checkbox" name="privates" checked={postOption.privates || false} onChange={onChangeOption}></input>
            <span>Private Post</span>
          </label>
          <label className="postsettingcontent">
            <input type="checkbox" name="blockComm" checked={postOption.blockComm || false} onChange={onChangeOption}></input>
            <span>Block comments</span>
          </label>
        </div>
        <div className="centerLine" />
        <span className="publicinSection">Title &#40; {postContent.title.length} / 30 &#41;</span>
        <input className="title-input" type='text' maxLength={30} placeholder='제목' value={postContent.title} onChange={onChangeContent} name="title" />
        <div className="centerLine" />
        <span className="publicinSection">HashTags &#40; Up to 5 tag &#41;</span>
        <div className="labelArea"> {/* 라벨 넣는곳 */}
          <Postlabel labelData={labelData} delLabel = {delLabel}/>
          {labelAddMode ? <span className="labelsContent">
            <input type="text" className="labelinputs" maxLength='15' onKeyPress={addLabel} ref={labelInputData}></input>
          </span> : <span className="labelsContent" onClick={setLabelMode}> {/* 라벨 추가 */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" style={{ position: "relative", top: "-2px" , right:"2px", cursor: "pointer" }} fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
          </span>}
        </div>
        <div className="centerLine" />
        <div className="attachmentarea">
          <span className="publicinSection">Attachments</span>
          <ShowFileList data={showFileList} delitem={deleteFile}/>
          <span className="attachchoose" onClick={() => imageInput.current.click()}>Add attachments &#40;Max 5 Files&#41;</span>
          <input type="file" onChange={(e) => uploadFile(e)} name="file" ref={imageInput} style={{ display: "none" }}/>
        </div>
        <div style={{height:"100px"}}/>
      </div>
    </section>
  )
}

export default NewPost;