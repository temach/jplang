port module Main exposing (..)

import Browser
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, br, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, class, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Html.Lazy exposing (lazy, lazy2, lazy3)
import Http
import Json.Decode as D
import Json.Encode as E
import List.Extra
import Platform.Cmd as Cmd
import Url.Builder exposing (relative)

-- Popover
-- documentation: http://elm-bootstrap.info/popover
-- documentation code: https://github.com/rundis/elm-bootstrap.info/blob/master/src/Page/Popover.elm
-- library source code: https://github.com/rundis/elm-bootstrap/blob/master/src/Bootstrap/Popover.elm
import Bootstrap.Popover as Popover
import Bootstrap.Button as Button



-- PORTS


port sendMessage : E.Value -> Cmd msg


port messageReceiver : (D.Value -> msg) -> Sub msg



-- MAIN
-- see: https://package.elm-lang.org/packages/elm/browser/latest/Browser#document


main =
    Browser.element
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }



-- MODEL


type alias KeyCandidate =
    { word : String
    , metadata : String
    , freq : List Int
    }


type alias Frequency =
    List Int


type alias WorkElement =
    { kanji : String
    , keyword : String
    , notes : String
    }


type alias Model =
    { currentWork : WorkElement
    , workElements : List WorkElement
    , currentWorkIndex : Int
    , freq : List Int
    , userMessages : Dict String String
    , onSubmitFailIndex : Int
    , popoverState : Popover.State
    }


defaultCurrentWork =
    WorkElement "" "" ""


brokenCurrentWork =
    WorkElement "{{ no_kanji }}" "{{ error }}" "{{ unknown_error_description }}"


defaultModel =
    { currentWork = defaultCurrentWork
    , workElements = []
    , currentWorkIndex = 0
    , freq = []
    , userMessages = Dict.empty
    , onSubmitFailIndex = 0
    , popoverState = Popover.initialState
    }


init : () -> ( Model, Cmd Msg )
init _ =
    -- ( model, Cmd.none )
    ( defaultModel, getWorkElements )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch [ messageReceiver RecvNewElementValue ]


keywordEncoder : String -> E.Value
keywordEncoder keyword =
    E.object
        [ ( "keyword", E.string keyword ) ]


elementEncoder : WorkElement -> E.Value
elementEncoder elem =
    E.object
        [ ( "kanji", E.string elem.kanji )
        , ( "keyword", E.string elem.keyword )
        , ( "notes", E.string elem.notes )
        ]


elementDecoder : D.Decoder WorkElement
elementDecoder =
    D.map3 WorkElement
        (D.field "kanji" D.string)
        (D.field "keyword" D.string)
        (D.field "notes" D.string)


keywordDecoder : D.Decoder String
keywordDecoder =
    D.field "keyword" D.string



-- UPDATE


type Msg
    = SelectWorkElement Int
    | RecvNewElementValue D.Value
      -- work element manipulations
    | KeywordInput String
    | NotesInput String
    | ElementSubmitClick
      -- Http responses
    | WorkElementsReady (Result Http.Error (List WorkElement))
    | ElementSubmitReady (Result Http.Error String)
    | KeywordCheckReady (Result Http.Error KeyCandidate)
    | PopoverMsg Popover.State


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        WorkElementsReady result ->
            case result of
                Ok elements ->
                    let
                        newModel =
                            { model | workElements = elements }
                    in
                    update (SelectWorkElement newModel.currentWorkIndex) newModel

                Err httpError ->
                    -- HTTP error: do nothing, just report
                    let
                        message =
                            buildErrorMessage httpError

                        newUserMessages =
                            Dict.insert "WorkElementsReady" message model.userMessages

                        newModel =
                            { model | userMessages = newUserMessages }
                    in
                    ( newModel, Cmd.none )

        SelectWorkElement index ->
            let
                selected =
                    Maybe.withDefault
                        brokenCurrentWork
                        (List.Extra.getAt index model.workElements)

                newModel =
                    { model | currentWorkIndex = index, currentWork = selected }

                cmd =
                    Cmd.batch
                        [ getKeywordCheck newModel.currentWork.kanji newModel.currentWork.keyword
                        , sendMessage (elementEncoder newModel.currentWork)
                        ]
            in
            ( newModel, cmd )

        RecvNewElementValue jsonValue ->
            case D.decodeValue elementDecoder jsonValue of
                Ok elem ->
                    let
                        -- update current element
                        updatedElement =
                            WorkElement elem.kanji elem.keyword elem.notes

                        updatedWorkElements =
                            List.Extra.setAt model.currentWorkIndex updatedElement model.workElements

                        -- select the next work element to display
                        index =
                            model.currentWorkIndex + 1

                        currentElement =
                            Maybe.withDefault
                                brokenCurrentWork
                                (List.Extra.getAt index model.workElements)

                        newModel =
                            { model
                                | workElements = updatedWorkElements
                                , currentWorkIndex = index
                                , currentWork = currentElement
                                , onSubmitFailIndex = model.currentWorkIndex
                                , userMessages = Dict.empty
                            }

                        cmd =
                            Cmd.batch
                                [ submitElement updatedElement
                                , sendMessage (elementEncoder currentElement)
                                , getKeywordCheck currentElement.kanji currentElement.keyword
                                ]
                    in
                    -- post to backend and send the message with next work element
                    ( newModel, cmd )

                Err _ ->
                    -- if you could not decode a full element, try to decode just a keyword
                    case D.decodeValue keywordDecoder jsonValue of
                        Ok keyword ->
                            update (KeywordInput keyword) model

                        Err _ ->
                            ( model, Cmd.none )

        ElementSubmitReady result ->
            case result of
                Ok body ->
                    if String.length body > 0 then
                        -- logical error: refresh all elements from db
                        let
                            message =
                                "{{ submit_failed }}" ++ body

                            newUserMessages =
                                Dict.insert "ElementSubmitReady" message model.userMessages

                            newModel =
                                { model | userMessages = newUserMessages, currentWorkIndex = model.onSubmitFailIndex }
                        in
                        ( newModel, getWorkElements )

                    else
                        -- submit went ok: do nothing
                        -- the model has already been updated and the message has already been sent
                        ( model, Cmd.none )

                Err httpError ->
                    -- HTTP error: do nothing, just report
                    let
                        message =
                            buildErrorMessage httpError

                        newUserMessages =
                            Dict.insert "ElementSubmitReady" message model.userMessages

                        newModel =
                            { model | userMessages = newUserMessages }
                    in
                    ( newModel, Cmd.none )

        ElementSubmitClick ->
            if String.length model.currentWork.keyword > 0 then
                let
                    -- update current elements array
                    updatedWorkElements =
                        List.Extra.setAt model.currentWorkIndex model.currentWork model.workElements

                    -- select the next work element to display
                    index =
                        model.currentWorkIndex + 1

                    currentElement =
                        Maybe.withDefault
                            brokenCurrentWork
                            (List.Extra.getAt index model.workElements)

                    newModel =
                        { model
                            | workElements = updatedWorkElements
                            , currentWorkIndex = index
                            , currentWork = currentElement
                            , onSubmitFailIndex = model.currentWorkIndex
                            , userMessages = Dict.empty
                        }

                    cmd =
                        Cmd.batch
                            [ submitElement model.currentWork
                            , sendMessage (elementEncoder currentElement)
                            , getKeywordCheck currentElement.kanji currentElement.keyword
                            ]
                in
                -- send post request and message the world with new work element
                ( newModel, cmd )

            else
                ( { model | userMessages = Dict.insert "ElementSubmitClick" "{{ submit_onclick_error }}" model.userMessages }, Cmd.none )

        KeywordInput word ->
            let
                current =
                    model.currentWork

                newCurrentWork =
                    { current | keyword = word }

                newModel =
                    { model | currentWork = newCurrentWork }

                cmd =
                    Cmd.batch
                        [ getKeywordCheck newCurrentWork.kanji newCurrentWork.keyword
                        , sendMessage (keywordEncoder newCurrentWork.keyword)
                        ]
            in
            if String.length word >= 2 then
                ( newModel, cmd )

            else
                ( { newModel | freq = [], userMessages = Dict.empty }, Cmd.none )

        NotesInput word ->
            let
                current =
                    model.currentWork

                newCurrentWork =
                    { current | notes = word }

                newModel =
                    { model | currentWork = newCurrentWork }
            in
            ( newModel, Cmd.none )

        KeywordCheckReady result ->
            case result of
                Ok elem ->
                    ( { model | freq = elem.freq, userMessages = Dict.insert "KeywordCheckReady" elem.metadata model.userMessages }, Cmd.none )

                Err _ ->
                    ( { model | freq = [], userMessages = Dict.insert "KeywordCheckReady" "{{ error_keyword_check }}" model.userMessages }, Cmd.none )

        PopoverMsg state ->
            ( { model | popoverState = state }, Cmd.none )



buildErrorMessage : Http.Error -> String
buildErrorMessage httpError =
    case httpError of
        Http.BadUrl message ->
            message

        Http.Timeout ->
            "{{ http_error_timeout }}"

        Http.NetworkError ->
            "{{ http_error_network }}"

        Http.BadStatus statusCode ->
            "{{ http_error_bad_status }}" ++ String.fromInt statusCode

        Http.BadBody message ->
            message


getKeywordCheck : String -> String -> Cmd Msg
getKeywordCheck kanji keyword =
    Http.get
        { url = relative [ "api", "keywordcheck/" ++ kanji ++ "/" ++ keyword ] []
        , expect = Http.expectJson KeywordCheckReady keyCandidateDecoder
        }


keyCandidateDecoder : D.Decoder KeyCandidate
keyCandidateDecoder =
    D.map3 KeyCandidate
        (D.field "word" D.string)
        (D.field "metadata" D.string)
        (D.field "freq" (D.list D.int))


getWorkElements : Cmd Msg
getWorkElements =
    Http.get
        { url = relative [ "api", "work" ] []
        , expect = Http.expectJson WorkElementsReady workElementsDecoder
        }


workElementsDecoder : D.Decoder (List WorkElement)
workElementsDecoder =
    D.field "work"
        (D.list
            (D.map3
                WorkElement
                (D.index 0 D.string)
                (D.index 1 D.string)
                (D.index 2 D.string)
            )
        )


submitElement : WorkElement -> Cmd Msg
submitElement element =
    Http.post
        { url = relative [ "api", "submit" ] []
        , body = Http.jsonBody (submitElementEncoder element)
        , expect = Http.expectString ElementSubmitReady
        }


submitElementEncoder : WorkElement -> E.Value
submitElementEncoder element =
    E.object
        [ ( "kanji", E.string element.kanji )
        , ( "keyword", E.string element.keyword )
        , ( "notes", E.string element.notes )
        ]

calcTotalFrequency : Frequency -> Int
calcTotalFrequency freq =
    ((Maybe.withDefault 0 <| List.Extra.getAt 0 freq) + (Maybe.withDefault 0 <| List.Extra.getAt 1 freq)) // 2


-- VIEW


view : Model -> Html Msg
view model =
    render model


renderSubmitBar : WorkElement -> Frequency -> Popover.State -> Html Msg
renderSubmitBar currentWork freq popoverState =
    div [ style "display" "flex" ]
        [ span
            [ style "flex" "1 0 auto" ]
            [ text currentWork.kanji ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "{{ keyword_placeholder }}"
                , value currentWork.keyword
                , onInput KeywordInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        , span
            [ style "flex" "1 0 auto" ]
            [ text ("{{ total_freq }}" ++ (String.fromInt <| calcTotalFrequency freq) ++ " ")
            , Popover.config
                ( Button.button
                    [ Button.small
                    , Button.outlinePrimary
                    , Button.attrs <|
                        Popover.onClick popoverState PopoverMsg
                    ]
                    [ text "?"
                    ]
                )
                |> Popover.bottom
                |> Popover.titleH4 [] [ text "{{ freq_decomposition_title }}" ]
                |> Popover.content []
                    [ text "{{ freq_decomposition_explanation }}"
                    , br [] []
                    , text ("{{ google_corpus_freq }}" ++ (String.fromInt <| Maybe.withDefault 0 <| List.Extra.getAt 0 freq))
                    , br [] []
                    , text ("{{ subtitles_freq }}" ++ (String.fromInt <| Maybe.withDefault 0 <| List.Extra.getAt 1 freq))
                    ]
                |> Popover.view popoverState
            ]
        , span
            [ style "flex" "1 0 auto" ]
            [ Button.button
                    [ Button.small
                    , Button.primary
                    , Button.attrs [ onClick ElementSubmitClick ]
                    ]
                    [ text "{{ submit_button }}"
                    ]
            ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "{{ notes_title }}"
                , value currentWork.notes
                , onInput NotesInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        ]


renderSingleWorkElement : Int -> WorkElement -> Html Msg
renderSingleWorkElement index elem =
    div
        [ style "padding" "2px 0"
        , style "display" "flex"
        , class "moonspeak-row"
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "flex" "0 0 auto"
            , style "margin" "0 0.5rem"
            ]
            [ text elem.kanji ]
        , span
            [ style "flex" "1 0 4rem"
            , style "margin" "0 0.5rem"
            , if String.length elem.keyword > 0 then
                style "background-color" "rgb(200, 210, 200)"

              else
                style "background-color" ""
            ]
            [ text elem.keyword ]
        , span
            [ style "flex" "10 1 auto"
            , if String.length elem.notes > 0 then
                style "background-color" "rgb(200, 200, 210)"

              else
                style "background-color" ""
            ]
            [ text elem.notes ]
        ]


renderWorkElements : Model -> Html Msg
renderWorkElements model =
    let
        partial =
            lazy2 renderSingleWorkElement
    in
    div
        [ on "click" (D.map SelectWorkElement targetValueIntParse)
        , style "overflow" "auto"
        , style "flex-grow" "1"
        ]
        (List.indexedMap partial model.workElements)


renderUserMessages : Model -> Html Msg
renderUserMessages model =
    div [] [ text (String.join "!" (Dict.values model.userMessages)) ]


render : Model -> Html Msg
render model =
    div
        [ style "background-color" "rgb(210, 210, 210)"
        , style "height" "98vh"
        , style "padding" "6px"
        , style "margin" "8px"
        , style "display" "flex"
        , style "flex-direction" "column"
        ]
        [
            div
                []
                [ lazy renderUserMessages model
                , lazy2 div [] [ text "{{ title }}" ]
                , lazy3 renderSubmitBar model.currentWork model.freq model.popoverState
                ]
            , lazy renderWorkElements model
        ]
